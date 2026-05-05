import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as puppeteer from 'puppeteer';
import { classifyCookie } from './cookie-dictionary.util';
import { ScanStatus, ScanDepth } from '@prisma/client';
import { ComplianceScannerService } from './compliance-scanner.service';

export interface CookieScanJobData {
  websiteId: string;
}

@Processor('cookie-scanner')
export class CookieScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(CookieScannerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly complianceScanner: ComplianceScannerService,
  ) {
    super();
  }

  async process(job: Job<CookieScanJobData>): Promise<any> {
    const { websiteId } = job.data;
    this.logger.log(`Starting Advanced Professional Scan for website: ${websiteId}`);

    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    let browser: puppeteer.Browser | null = null;
    const visited = new Set<string>();
    const queue: string[] = [website.url];
    const maxPages = website.depth === ScanDepth.DEEP ? 1000 : 100;
    const discoveredCookies = new Map<string, any>();
    const thirdPartyScriptsSet = new Set<string>();
    const complianceSignals = {
      hasPrivacyPolicy: false,
      hasCookieNotice: false,
      hasComplianceNotice: false,
      hasDsar: false,
      hasGrievance: false,
      hasOptOut: false,
      hasThirdPartyDisclosure: false,
      hasLocalization: false,
    };

    try {
      // 1. Update status
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS }
      });

      // 2. Launch Puppeteer with lean settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ],
      });

      // 4. Crawling Loop (Optimized for Parallelism & Speed)
      const CONCURRENCY = 5; 
      
      while (queue.length > 0 && visited.size < maxPages) {
        const batch: string[] = [];
        while (queue.length > 0 && batch.length < CONCURRENCY && (visited.size + batch.length) < maxPages) {
          const next = queue.shift()!;
          if (!visited.has(next)) batch.push(next);
        }

        if (batch.length === 0) continue;

        await Promise.all(batch.map(async (currentUrl) => {
          if (visited.has(currentUrl)) return;
          visited.add(currentUrl);

          // Check if website still exists
          const websiteCheck = await this.prisma.scannedWebsite.findUnique({
            where: { id: websiteId },
            select: { id: true }
          });
          if (!websiteCheck) return;

          const page = await browser!.newPage();
          try {
            // Speed Hack: Block unnecessary resources
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              const type = req.resourceType();
              if (['image', 'stylesheet', 'font', 'media', 'other'].includes(type)) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Proteccio-Scanner/1.1');

            this.logger.log(`[Scanning] ${visited.size}/${maxPages}: ${currentUrl}`);
            
            // Fast Load
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            // Quick check for cookies (no extensive scrolling unless it's first few pages)
            if (visited.size <= 5) {
               await page.evaluate(() => window.scrollBy(0, 1000));
               await new Promise(r => setTimeout(r, 1000));
            }

            // Global check for localization (html lang)
            const lang = await page.evaluate(() => document.documentElement.lang);
            if (lang && lang !== 'en') complianceSignals.hasLocalization = true;

            // Detect Page Types
            const isPrivacyPage = /privacy(-)?policy|privacy/i.test(currentUrl);
            const isCookiePage = /cookie(-)?policy|cookie(-)?notice/i.test(currentUrl);
            const isCompliancePage = /compliance|legal|grievance/i.test(currentUrl);

            if (isPrivacyPage) complianceSignals.hasPrivacyPolicy = true;
            if (isCookiePage) complianceSignals.hasCookieNotice = true;
            if (isCompliancePage) complianceSignals.hasComplianceNotice = true;

            // Deep Content Scan
            const pageText = await page.evaluate(() => document.body.innerText);
            const lowerText = pageText.toLowerCase();

            if (isPrivacyPage || isCookiePage) {
               if (lowerText.includes('dsar') || lowerText.includes('data subject access') || lowerText.includes('your rights')) {
                 complianceSignals.hasDsar = true;
               }
               if (lowerText.includes('opt-out') || lowerText.includes('withdraw') || lowerText.includes('unsubscribe')) {
                 complianceSignals.hasOptOut = true;
               }
               if (lowerText.includes('third party') || lowerText.includes('disclosure') || lowerText.includes('share data')) {
                 complianceSignals.hasThirdPartyDisclosure = true;
               }
            }

            if (isPrivacyPage || isCompliancePage) {
               if (lowerText.includes('grievance') || lowerText.includes('complaint') || lowerText.includes('nodal officer')) {
                 complianceSignals.hasGrievance = true;
               }
            }

            // Capture Cookies
            const cookies = await page.cookies();
            for (const cookie of cookies) {
              if (!discoveredCookies.has(cookie.name)) {
                discoveredCookies.set(cookie.name, { ...cookie, foundOn: currentUrl });
              }
            }

            // Capture Third-party scripts
            const scripts = await page.$$eval('script[src]', (elements) => elements.map(e => e.src));
            const wUrl = new URL(website.url);
            scripts.forEach(s => {
               try {
                  const sUrl = new URL(s);
                  if (sUrl.hostname !== wUrl.hostname) thirdPartyScriptsSet.add(sUrl.hostname);
               } catch {}
            });

            // Extract links
            const links = await page.$$eval('a', (anchors) => 
              anchors.map(a => a.href).filter(href => href.startsWith('http'))
            );

            const baseUrl = new URL(website.url);
            for (const link of links) {
              try {
                const linkUrl = new URL(link);
                if (linkUrl.hostname === baseUrl.hostname && !visited.has(link)) {
                  queue.push(link);
                }
              } catch {}
            }
          } catch (err) {
            this.logger.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
          } finally {
            await page.close();
          }
        }));
      }

      // 4. Process Discovered Cookies
      const finalCheck = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        select: { id: true }
      });

      if (!finalCheck) {
        this.logger.warn(`Website ${websiteId} was deleted during scan. Aborting processing.`);
        return { status: 'ABORTED', reason: 'Website deleted' };
      }

      const results: any[] = [];
      const categoryCounts: Record<string, number> = {
        NECESSARY: 0,
        FUNCTIONAL: 0,
        ANALYTICS: 0,
        MARKETING: 0,
        UNCATEGORIZED: 0
      };

      for (const [name, cookie] of discoveredCookies.entries()) {
        let info = {
          category: 'UNCATEGORIZED' as any,
          description: 'Unknown cookie discovered during scan.'
        };

        // Only categorize if the flag is enabled
        if (website.autoCategorize) {
          info = classifyCookie(name);
        }

        categoryCounts[info.category]++;

        let category = await this.prisma.cookieCategory.findFirst({
          where: { category: info.category, tenantId: website.tenantId }
        });

        if (!category) {
          category = await this.prisma.cookieCategory.create({
            data: { name: info.category, category: info.category, tenantId: website.tenantId }
          });
        }

        const existing = await this.prisma.cookieInventory.findFirst({
           where: { name: name.trim(), domain: website.url, tenantId: website.tenantId }
        });

        if (existing) {
          await this.prisma.cookieInventory.update({
            where: { id: existing.id },
            data: { categoryId: category.id, description: info.description, websiteId }
          });
        } else {
          const inventory = await this.prisma.cookieInventory.create({
            data: {
              name: name.trim(),
              domain: website.url,
              categoryId: category.id,
              description: info.description,
              expiration: cookie.expires ? new Date(cookie.expires * 1000).toLocaleDateString() : 'Session',
              tenantId: website.tenantId,
              websiteId
            }
          });
          results.push(inventory);
        }
      }

      // 5. Finalize Scan
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { 
          status: ScanStatus.COMPLETED,
          lastScan: new Date(),
          pagesCrawled: visited.size,
          cookiesDetected: discoveredCookies.size,
        }
      });

      // Run Compliance Scanner
      await this.complianceScanner.evaluateCompliance(
         websiteId,
         discoveredCookies.size,
         Array.from(visited),
         Array.from(thirdPartyScriptsSet),
         complianceSignals
      );

      const updatedWebsite = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });

      // 6. Send Notification Email
      if (website.email) {
        await this.notificationsService.sendCookieScanCompletionEmail(
          website.email,
          website.name,
          {
            totalCookies: discoveredCookies.size,
            pagesScanned: visited.size,
            necessaryCount: categoryCounts['NECESSARY'],
            functionalCount: categoryCounts['FUNCTIONAL'],
            analyticsCount: categoryCounts['ANALYTICS'],
            marketingCount: categoryCounts['MARKETING'],
            complianceScore: updatedWebsite?.complianceScore || 'N/A',
            riskLevel: updatedWebsite?.riskLevel || 'N/A'
          }
        );
      }

      this.logger.log(`Professional Scan complete for ${website.url}. Pages: ${visited.size}, Cookies: ${discoveredCookies.size}`);
      return { cookiesFound: discoveredCookies.size, pagesScanned: visited.size };

    } catch (error) {
      this.logger.error(`Scan failed for website ${websiteId}: ${error.message}`);
      try {
        await this.prisma.scannedWebsite.update({
          where: { id: websiteId },
          data: { status: ScanStatus.FAILED }
        });
      } catch (dbError) {
        this.logger.warn(`Could not update failure status for ${websiteId}: ${dbError.message}`);
      }
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}
