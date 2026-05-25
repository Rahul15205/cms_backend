import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCookieCategoryDto } from './dto/create-cookie-category.dto';
import { CreateCookieInventoryDto } from './dto/create-cookie-inventory.dto';
import { CreateScannedWebsiteDto } from './dto/create-scanned-website.dto';
import { CreateCookieBannerDto } from './dto/create-cookie-banner.dto';
import { CreateCookieConsentLogDto } from './dto/create-cookie-consent-log.dto';
import * as geoip from 'geoip-lite';
import axios from 'axios';
import {
  deriveVisitorIdFromIp,
  shouldReplaceClientVisitorId,
} from '../common/utils/visitor-id.utils';
import { CookieComplianceReportService } from './cookie-compliance-report.service';

@Injectable()
export class CookiesManagementService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cookie-scanner') private readonly cookieScannerQueue: Queue,
    private readonly cookieComplianceReportService: CookieComplianceReportService,
  ) {}

  // ---------------------------------------------------------
  // Cookie Categories
  // ---------------------------------------------------------

  async createCategory(dto: CreateCookieCategoryDto, tenantId: string) {
    return this.prisma.cookieCategory.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getCategories(tenantId: string) {
    return this.prisma.cookieCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { cookies: true },
        },
      },
    });
  }

  async updateCategory(id: string, dto: Partial<CreateCookieCategoryDto>, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
    if (!category || category.tenantId !== tenantId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.cookieCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
    if (!category || category.tenantId !== tenantId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.cookieCategory.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Cookie Inventory
  // ---------------------------------------------------------

  async createCookie(dto: CreateCookieInventoryDto, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Cookie category not found');
    }

    return this.prisma.cookieInventory.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getInventory(tenantId: string) {
    return this.prisma.cookieInventory.findMany({
      where: { tenantId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCookie(id: string, dto: Partial<CreateCookieInventoryDto>, tenantId: string) {
    const cookie = await this.prisma.cookieInventory.findUnique({
      where: { id },
    });

    if (!cookie || cookie.tenantId !== tenantId) {
      throw new NotFoundException('Cookie not found');
    }

    return this.prisma.cookieInventory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCookie(id: string, tenantId: string) {
    const cookie = await this.prisma.cookieInventory.findUnique({ where: { id } });
    if (!cookie || cookie.tenantId !== tenantId) {
      throw new NotFoundException('Cookie not found');
    }
    return this.prisma.cookieInventory.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Website Scanner (Phase 2)
  // ---------------------------------------------------------

  async createWebsite(dto: CreateScannedWebsiteDto, tenantId: string) {
    const website = await this.prisma.scannedWebsite.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    // Automatically trigger first scan (full scan, high priority)
    await this.cookieScannerQueue.add('scan-website', 
      { websiteId: website.id, scanType: 'FULL' }, 
      { jobId: `manual-scan-${website.id}-${Date.now()}`, priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 60000 }, removeOnComplete: 200, removeOnFail: 100 }
    );

    return website;
  }

  async getWebsites(tenantId: string) {
    return this.prisma.scannedWebsite.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWebsiteById(id: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, url: true },
    });
    if (!website) throw new NotFoundException('Website not found');
    return website;
  }

  async updateWebsite(id: string, dto: Partial<CreateScannedWebsiteDto>, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    const updatedWebsite = await this.prisma.scannedWebsite.update({
      where: { id },
      data: dto,
    });

    // Automatically restart scan after edit (full re-scan)
    await this.cookieScannerQueue.add('scan-website', 
      { websiteId: id, scanType: 'FULL' }, 
      { jobId: `manual-scan-${id}-${Date.now()}`, priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 60000 }, removeOnComplete: 200, removeOnFail: 100 }
    );

    await this.prisma.scannedWebsite.update({
      where: { id },
      data: {
        status: 'PENDING',
        lastScan: new Date(),
      },
    });

    return updatedWebsite;
  }

  async startScan(id: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    // Dispatch the scan job (manual trigger = full scan, highest priority)
    await this.cookieScannerQueue.add('scan-website', 
      { websiteId: id, scanType: 'FULL' }, 
      { jobId: `manual-scan-${id}-${Date.now()}`, priority: 1, attempts: 3, backoff: { type: 'exponential', delay: 60000 }, removeOnComplete: 200, removeOnFail: 100 }
    );

    return this.prisma.scannedWebsite.update({
      where: { id },
      data: {
        status: 'PENDING',
        lastScan: new Date(),
      },
    });
  }

  async deleteWebsite(id: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({ where: { id } });
    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }
    return this.prisma.scannedWebsite.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Cookie Banners (Phase 3)
  // ---------------------------------------------------------

  async createBanner(dto: CreateCookieBannerDto, tenantId: string) {
    return this.prisma.cookieBanner.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getBanners(tenantId: string) {
    return this.prisma.cookieBanner.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBanner(id: string, dto: Partial<CreateCookieBannerDto>, tenantId: string) {
    const banner = await this.prisma.cookieBanner.findUnique({
      where: { id },
    });

    if (!banner || banner.tenantId !== tenantId) {
      throw new NotFoundException('Banner not found');
    }

    return this.prisma.cookieBanner.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBanner(id: string, tenantId: string) {
    const banner = await this.prisma.cookieBanner.findUnique({ where: { id } });
    if (!banner || banner.tenantId !== tenantId) {
      throw new NotFoundException('Banner not found');
    }
    return this.prisma.cookieBanner.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Consent Logs & Compliance (Phase 4)
  // ---------------------------------------------------------

  async recordConsentLog(dto: CreateCookieConsentLogDto, tenantId: string) {
    return this.prisma.cookieConsentLog.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  private maskIp(ip?: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost')) return 'Localhost';
    
    // Clean IP for masking (remove ::ffff: if present)
    const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    
    if (cleanIp.includes(':')) {
      // Standard IPv6
      const parts = cleanIp.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = 'xxxx';
        return parts.join(':');
      }
    } else {
      // Standard IPv4
      const parts = cleanIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    return cleanIp;
  }

  private async getLocation(ip?: string): Promise<string> {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost')) return 'Localhost (Internal)';
    
    let cleanIp = ip.split(',')[0].trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }
    
    // Check for private/internal IP ranges
    const isPrivate = 
      cleanIp.startsWith('10.') || 
      cleanIp.startsWith('192.168.') || 
      (cleanIp.split('.').length === 4 && (parts => {
        const second = parseInt(parts[1]);
        return parts[0] === '172' && second >= 16 && second <= 31;
      })(cleanIp.split('.')));
    
    if (isPrivate) return 'Private Network';
    
    try {
      // 1. Try local geoip-lite first
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        const city = geo.city;
        const region = geo.region;
        const country = geo.country;
        
        const parts: string[] = [];
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);
        if (country) parts.push(country);
        
        if (parts.length > 0) return parts.join(', ');
      }

      // 2. Fallback to external API (ipapi.co)
      const response = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 3000 });
      if (response.data && !response.data.error) {
        const { city, region, country_name, country_code } = response.data;
        const parts: string[] = [];
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);
        if (country_name) parts.push(country_name);
        else if (country_code) parts.push(country_code);
        
        if (parts.length > 0) return parts.join(', ');
      }
    } catch (e) {
      console.warn('Proteccio: GeoIP lookup failed', e.message);
    }
    
    return 'Global Access';
  }

  /** Stable visitor ID: same IP + website → same userId on every consent. */
  resolveVisitorId(ip: string | undefined, websiteId: string, clientUserId?: string): string {
    const ipBasedId = deriveVisitorIdFromIp(ip, websiteId);
    if (shouldReplaceClientVisitorId(clientUserId)) {
      return ipBasedId;
    }
    return ipBasedId;
  }

  async recordPublicConsent(websiteId: string, dto: any) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId }
    });

    if (!website) return null;

    let status: any = 'ACCEPTED';
    const rawStatus = (dto.status || '').toUpperCase();
    if (rawStatus === 'REJECTED') status = 'REJECTED';
    else if (rawStatus === 'WITHDRAWN') status = 'WITHDRAWN';

    const location = await this.getLocation(dto.ipAddress);
    const userId = this.resolveVisitorId(dto.ipAddress, websiteId, dto.userId);

    return this.prisma.cookieConsentLog.create({
      data: {
        userId: userId,
        region: location,
        categories: dto.categories,
        status: status,
        ipAddress: this.maskIp(dto.ipAddress),
        language: dto.language || 'en',
        websiteId: websiteId,
        tenantId: website.tenantId,
      },
    });
  }

  async checkConsentStatus(websiteId: string, userId: string) {
    const log = await this.prisma.cookieConsentLog.findFirst({
      where: {
        websiteId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: log?.status || 'NONE',
      categories: log?.categories || [],
    };
  }

  async getConsentLogs(tenantId: string) {
    return this.prisma.cookieConsentLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 500, // Increased limit for better visibility
    });
  }

  async backfillLocations(tenantId: string) {
    const logs = await this.prisma.cookieConsentLog.findMany({
      where: {
        tenantId,
        OR: [
          { region: 'Unknown' },
          { region: 'Private Network' },
          { region: 'Localhost' }
        ]
      },
    });

    let updatedCount = 0;
    for (const log of logs) {
      // We need the original IP to resolve, but we masked it in the DB.
      // Wait, if the IP is masked like 172.21.0.xxx, we CANNOT resolve it accurately.
      // However, if it's a public IP that was masked, we might get a general location.
      // This is a limitation of masking before storing.
      
      // If the log already has a masked IP that looks like a private network, 
      // there's not much we can do unless we have the original IP.
      
      // For future logs, we will store them correctly.
    }
    
    return { total: logs.length, updated: updatedCount, message: "Backfill is more effective for future logs as current IPs are masked." };
  }

  async getComplianceMetrics(tenantId: string, websiteId?: string) {
    const whereClause: any = { tenantId };
    if (websiteId && websiteId !== 'all') {
      whereClause.websiteId = websiteId;
    }

    // Filter cookies by website
    const cookieWhere: any = { tenantId };
    if (websiteId && websiteId !== 'all') {
      const website = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });
      if (website) {
        cookieWhere.domain = { contains: new URL(website.url).hostname };
      }
    }

    const totalCookies = await this.prisma.cookieInventory.count({
      where: cookieWhere,
    });

    const categoriesCount = await this.prisma.cookieCategory.count({
      where: { tenantId, enabled: true },
    });

    const totalLogs = await this.prisma.cookieConsentLog.count({
      where: whereClause,
    });

    const acceptedCount = await this.prisma.cookieConsentLog.count({
      where: { ...whereClause, status: 'ACCEPTED' },
    });

    const withdrawnCount = await this.prisma.cookieConsentLog.count({
      where: { ...whereClause, status: 'WITHDRAWN' },
    });

    // Get distribution by category
    const inventory = await this.prisma.cookieInventory.findMany({
      where: cookieWhere,
      include: { category: true }
    });

    const allCategories = await this.prisma.cookieCategory.findMany({
      where: { tenantId, enabled: true },
    });

    const distributionMap = new Map<string, number>();
    allCategories.forEach(cat => {
      distributionMap.set(cat.name, 0);
    });
    distributionMap.set('Uncategorized', 0);

    inventory.forEach(item => {
      const catName = item.category?.name || 'Uncategorized';
      distributionMap.set(catName, (distributionMap.get(catName) || 0) + 1);
    });

    if (distributionMap.get('Uncategorized') === 0) {
      distributionMap.delete('Uncategorized');
    }

    const palette = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
    let colorIndex = 0;
    const distribution = Array.from(distributionMap.entries()).map(([name, value]) => {
      const color = name.toUpperCase() === 'UNCATEGORIZED' ? '#94a3b8' : palette[colorIndex++ % palette.length];
      return { name, value, color };
    });

    // Calculate trends
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      newCookiesThisWeek,
      newCookiesLastWeek,
      consentsThisWeek,
      consentsLastWeek,
      optOutsThisWeek,
      optOutsLastWeek
    ] = await Promise.all([
      this.prisma.cookieInventory.count({ where: { ...cookieWhere, createdAt: { gte: oneWeekAgo } } }),
      this.prisma.cookieInventory.count({ where: { ...cookieWhere, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      this.prisma.cookieConsentLog.count({ where: { ...whereClause, createdAt: { gte: oneWeekAgo }, status: 'ACCEPTED' } }),
      this.prisma.cookieConsentLog.count({ where: { ...whereClause, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo }, status: 'ACCEPTED' } }),
      this.prisma.cookieConsentLog.count({ where: { ...whereClause, createdAt: { gte: oneWeekAgo }, status: 'REJECTED' } }),
      this.prisma.cookieConsentLog.count({ where: { ...whereClause, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo }, status: 'REJECTED' } }),
    ]);

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const kpiTrends = {
      cookies: { 
        value: calculateTrend(newCookiesThisWeek, newCookiesLastWeek), 
        direction: newCookiesThisWeek >= newCookiesLastWeek ? 'up' : 'down' 
      },
      consents: { 
        value: calculateTrend(consentsThisWeek, consentsLastWeek), 
        direction: consentsThisWeek >= consentsLastWeek ? 'up' : 'down' 
      },
      optOut: { 
        value: calculateTrend(optOutsThisWeek, optOutsLastWeek), 
        direction: optOutsThisWeek >= optOutsLastWeek ? 'up' : 'down' 
      }
    };

    // Get trend data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendLogs = await this.prisma.cookieConsentLog.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    const trendMap = new Map<string, { accepted: number, withdrawn: number, rejected: number }>();
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      trendMap.set(dateStr, { accepted: 0, withdrawn: 0, rejected: 0 });
    }

    trendLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const stats = trendMap.get(dateStr);
      if (stats) {
        if (log.status === 'ACCEPTED') stats.accepted++;
        else if (log.status === 'WITHDRAWN') stats.withdrawn++;
        else if (log.status === 'REJECTED') stats.rejected++;
      }
    });

    const trendArray = Array.from(trendMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .reverse(); // Chronological order

    return {
      totalCookies,
      categories: categoriesCount,
      activeConsents: acceptedCount,
      optOutRate: totalLogs > 0 ? Math.round(((totalLogs - acceptedCount) / totalLogs) * 100) : 0,
      distribution,
      trends: trendArray,
      kpiTrends,
      consentLogs: {
        total: totalLogs,
        accepted: acceptedCount,
        withdrawn: withdrawnCount,
      },
      complianceScore: totalLogs > 0 ? Math.round((acceptedCount / totalLogs) * 100) : 100,
    };
  }

  async getPublicBanner(websiteId: string) {
    const banner = await this.prisma.cookieBanner.findFirst({
      where: {
        websiteId,
        status: 'ACTIVE',
      },
      include: {
        website: true,
        tenant: {
          include: {
            cookieCategories: {
              where: { enabled: true },
              include: {
                cookies: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let finalBanner = banner;

    if (!finalBanner) {
      // Fallback to global banner if no website-specific active banner
      finalBanner = await this.prisma.cookieBanner.findFirst({
        where: {
          websiteId: null,
          status: 'ACTIVE',
        },
        include: {
          website: true,
          tenant: {
            include: {
              cookieCategories: {
                where: { enabled: true },
                include: {
                  cookies: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (finalBanner && (finalBanner as any).website) {
      try {
        const websiteUrl = (finalBanner as any).website.url;
        const hostname = new URL(websiteUrl).hostname.replace('www.', '');
        
        // Filter cookies in each category to only show those for this domain
        (finalBanner as any).tenant.cookieCategories.forEach(cat => {
          cat.cookies = cat.cookies.filter(cookie => {
            const cookieDomain = cookie.domain.toLowerCase().replace('www.', '');
            return cookieDomain.includes(hostname) || hostname.includes(cookieDomain);
          });
        });
      } catch (e) {
        console.error('Proteccio: Error filtering cookies by domain', e);
      }
    }

    return finalBanner;
  }

  async verifyIntegration(websiteId: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId }
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    try {
      // 1. Fetch the website HTML
      const response = await axios.get(website.url, { 
        timeout: 8000, // Slightly longer timeout for verification
        headers: { 
          'User-Agent': 'Proteccio-Integration-Scanner/1.0',
          'Cache-Control': 'no-cache'
        },
        validateStatus: () => true // Accept any status to check even if error page loads script
      });
      
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      const normalizedHtml = html.replace(/\s+/g, ' ').toLowerCase();
      const scriptPath = `/api/v1/public/cookies/banner-script/${websiteId}`.toLowerCase();
      const globalPath = '/api/v1/public/cookies/banner-script/global_id';

      const detectionPatterns: { id: string; label: string; test: (h: string) => boolean }[] = [
        {
          id: 'script_tag',
          label: 'HTML script tag',
          test: (h) => h.includes(scriptPath) || h.includes(globalPath),
        },
        {
          id: 'banner_script_url',
          label: 'Banner script URL',
          test: (h) =>
            h.includes('banner-script/') &&
            (h.includes(websiteId.toLowerCase()) || h.includes('global_id')),
        },
        {
          id: 'proteccio_loader',
          label: 'Proteccio loader (GTM / dynamic inject)',
          test: (h) =>
            h.includes('proteccio-cookie-banner-loader') ||
            h.includes('proteccio-cookie-banner'),
        },
        {
          id: 'wordpress_enqueue',
          label: 'WordPress wp_enqueue_script',
          test: (h) =>
            h.includes('proteccio-cookie-banner') &&
            (h.includes('wp_enqueue_script') || h.includes('wp_script_add_data')),
        },
        {
          id: 'gtm_inject',
          label: 'Google Tag Manager custom HTML',
          test: (h) =>
            h.includes(scriptPath) &&
            (h.includes('googletagmanager') || h.includes('gtm.js') || h.includes('datalayer')),
        },
      ];

      const matched = detectionPatterns.filter((p) => p.test(normalizedHtml));

      if (matched.length > 0) {
        const methods = matched.map((m) => m.label).join(', ');
        const isSiteSpecific = normalizedHtml.includes(scriptPath);
        return {
          success: true,
          message: `Installation verified (${methods}). The Proteccio cookie banner is referenced on your website.`,
          details: {
            scriptType: isSiteSpecific ? 'Website-specific' : 'Global Template',
            detectionMethods: matched.map((m) => m.id),
            urlChecked: website.url,
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: false,
        message:
          'Could not find the Proteccio banner on your website. Install via HTML script tag, Google Tag Manager, WordPress, Shopify, or another method from the installation guide, then verify again.',
        details: {
          urlChecked: website.url,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (e) {
      console.warn(`Proteccio: Verification failed for ${website.url}`, e.message);
      return {
        success: false,
        message: `Failed to reach the website: ${e.message}. Please ensure the URL is public and accessible.`,
        details: { 
          urlChecked: website.url,
          error: e.message
        }
      };
    }
  }

  async generateComplianceReportHtml(websiteId: string, tenantId: string): Promise<string> {
    return this.cookieComplianceReportService.generateHtml(websiteId, tenantId);
  }

  async generateComplianceReportPdf(websiteId: string, tenantId: string): Promise<Buffer> {
    return this.cookieComplianceReportService.generatePdf(websiteId, tenantId);
  }
}
