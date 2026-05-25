import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';
import {
  CookieComplianceReportData,
  ReportConsentRow,
  ReportDistributionItem,
  ReportIndicator,
  ReportTrendDay,
  renderCookieComplianceReport,
} from './cookie-compliance-report.renderer';

const REPORT_TIMEZONE = 'Asia/Kolkata';

/** Formats timestamps for PDF/HTML reports in Indian Standard Time */
function formatReportDateTimeIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: REPORT_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

function formatTrendDayKeyIST(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: REPORT_TIMEZONE,
    month: 'short',
    day: 'numeric',
  });
}

@Injectable()
export class CookieComplianceReportService {
  private readonly logger = new Logger(CookieComplianceReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateHtml(websiteId: string, tenantId: string): Promise<string> {
    const data = await this.buildReportData(websiteId, tenantId);
    return renderCookieComplianceReport(data);
  }

  async generatePdf(websiteId: string, tenantId: string): Promise<Buffer> {
    const html = await this.generateHtml(websiteId, tenantId);
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90_000 });
      await page
        .waitForFunction(() => typeof (window as unknown as { Chart?: unknown }).Chart !== 'undefined', {
          timeout: 20_000,
        })
        .catch(() => undefined);
      await new Promise((r) => setTimeout(r, 1200));

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '8mm', bottom: '10mm', left: '8mm' },
        preferCSSPageSize: false,
      });

      return Buffer.from(pdf);
    } catch (err) {
      this.logger.error(`PDF generation failed: ${(err as Error).message}`);
      throw new BadRequestException(
        'Failed to generate PDF report. Ensure Chromium/Puppeteer is available on the server.',
      );
    } finally {
      if (browser) await browser.close().catch(() => undefined);
    }
  }

  async buildReportData(websiteId: string, tenantId: string): Promise<CookieComplianceReportData> {
    const website = await this.prisma.scannedWebsite.findFirst({
      where: { id: websiteId, tenantId },
    });

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    if (!website.lastScan) {
      throw new BadRequestException('Run a compliance scan before generating the report.');
    }

    const scanResults = Array.isArray(website.scanResults) ? (website.scanResults as any[]) : [];
    const crawlDebug = scanResults.find((r) => r?.id === 'crawl_debug');
    const indicators: ReportIndicator[] = scanResults
      .filter((r) => r?.id && r.id !== 'crawl_debug')
      .map((r) => ({
        id: r.id,
        name: r.name || r.id,
        weight: r.weight ?? 0,
        passed: !!r.passed,
        score: r.score ?? 0,
        details: r.details || '',
        evidence: r.evidence,
      }));

    let baseDomain = '';
    try {
      baseDomain = new URL(website.url).hostname.replace(/^www\./, '');
    } catch {
      baseDomain = website.url;
    }

    const thirdPartyHosts = this.extractThirdPartyHosts(website.thirdPartyScripts);

    const categories = await this.prisma.cookieCategory.findMany({
      where: { tenantId, enabled: true },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const cookieWhere: any = { tenantId };
    try {
      cookieWhere.domain = { contains: new URL(website.url).hostname.replace(/^www\./, '') };
    } catch {
      /* keep tenant-wide inventory */
    }

    const inventory = await this.prisma.cookieInventory.findMany({
      where: cookieWhere,
      include: { category: true },
    });

    const distribution = this.buildDistribution(inventory, categories);
    const trend = await this.buildConsentTrend(websiteId, tenantId);
    const recentConsents = await this.buildRecentConsents(websiteId, tenantId, categoryMap);

    const now = new Date();
    const lastScan = website.lastScan;

    return {
      websiteName: website.name,
      websiteUrl: website.url,
      baseDomain,
      complianceScore: Math.round(website.complianceScore ?? 0),
      riskLevel: website.riskLevel || 'UNKNOWN',
      pagesCrawled: website.pagesCrawled ?? 0,
      cookiesFound: website.cookiesDetected ?? inventory.length,
      lastScanLabel: lastScan ? `Last scanned: ${formatReportDateTimeIST(lastScan)}` : 'Not scanned yet',
      generatedAtLabel: `Report date: ${formatReportDateTimeIST(now)}`,
      scanTrace: crawlDebug?.debug?.totals
        ? {
            queued: crawlDebug.debug.totals.queuedUnique ?? crawlDebug.debug.totals.queued ?? 0,
            attempted: crawlDebug.debug.totals.attempted ?? 0,
            crawled: crawlDebug.debug.totals.crawledUnique ?? crawlDebug.debug.totals.crawled ?? 0,
            skipped: crawlDebug.debug.totals.skipped ?? 0,
            baseDomain: crawlDebug.debug.baseDomain || baseDomain,
          }
        : null,
      indicators,
      thirdPartyHosts,
      distribution,
      trend,
      recentConsents,
      categoryMap,
      scanConfig: {
        name: website.name,
        url: website.url,
        frequency: this.formatFrequency(website.frequency),
        depth: website.depth === 'DEEP' ? 'Deep (Unlimited)' : 'Standard',
        autoCategorize: website.autoCategorize,
        scanBehindLogin: website.scanBehindLogin,
        email: website.email || website.pocEmail || '',
      },
    };
  }

  private extractThirdPartyHosts(thirdPartyScripts: unknown): string[] {
    if (!thirdPartyScripts) return [];
    const raw = Array.isArray(thirdPartyScripts) ? thirdPartyScripts : [];
    const hosts = new Set<string>();
    for (const item of raw) {
      if (typeof item === 'string') {
        try {
          hosts.add(new URL(item.startsWith('http') ? item : `https://${item}`).hostname);
        } catch {
          hosts.add(item);
        }
      } else if (item && typeof item === 'object') {
        const domain = (item as any).domain || (item as any).host || (item as any).url;
        if (domain) {
          try {
            hosts.add(
              typeof domain === 'string' && domain.includes('://')
                ? new URL(domain).hostname
                : String(domain).replace(/^www\./, ''),
            );
          } catch {
            hosts.add(String(domain));
          }
        }
      }
    }
    return Array.from(hosts).sort();
  }

  private buildDistribution(
    inventory: { category?: { name: string } | null }[],
    categories: { name: string }[],
  ): ReportDistributionItem[] {
    const palette = ['#1dd05e', '#3b82f6', '#f59e0b', '#9ca3af', '#8b5cf6', '#ef4444', '#06b6d4'];
    const map = new Map<string, number>();
    categories.forEach((c) => map.set(c.name, 0));
    map.set('Uncategorized', 0);

    inventory.forEach((item) => {
      const name = item.category?.name || 'Uncategorized';
      map.set(name, (map.get(name) || 0) + 1);
    });

    if (map.get('Uncategorized') === 0) map.delete('Uncategorized');

    let i = 0;
    return Array.from(map.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color:
          name.toUpperCase() === 'UNCATEGORIZED'
            ? '#9ca3af'
            : palette[i++ % palette.length],
      }));
  }

  private async buildConsentTrend(websiteId: string, tenantId: string): Promise<ReportTrendDay[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await this.prisma.cookieConsentLog.findMany({
      where: { tenantId, websiteId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, status: true },
    });

    const trendMap = new Map<string, { accepted: number; rejected: number; withdrawn: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatTrendDayKeyIST(d);
      trendMap.set(key, { accepted: 0, rejected: 0, withdrawn: 0 });
    }

    logs.forEach((log) => {
      const key = formatTrendDayKeyIST(new Date(log.createdAt));
      const stats = trendMap.get(key);
      if (!stats) return;
      if (log.status === 'ACCEPTED') stats.accepted++;
      else if (log.status === 'REJECTED') stats.rejected++;
      else if (log.status === 'WITHDRAWN') stats.withdrawn++;
    });

    return Array.from(trendMap.entries()).map(([name, stats]) => ({ name, ...stats }));
  }

  private async buildRecentConsents(
    websiteId: string,
    tenantId: string,
    categoryMap: Record<string, string>,
  ): Promise<ReportConsentRow[]> {
    const logs = await this.prisma.cookieConsentLog.findMany({
      where: { tenantId, websiteId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return logs.map((log) => ({
      userId: log.userId ? `VIS-${log.userId.slice(0, 16).toUpperCase()}` : 'Anonymous',
      region: log.region || '—',
      language: (log.language || 'en').toUpperCase(),
      categories: (log.categories || []).map((id) => categoryMap[id] || id),
      status: log.status,
    }));
  }

  private formatFrequency(freq: string): string {
    const map: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      ONCE: 'First Time Scan',
    };
    return map[freq] || freq;
  }
}
