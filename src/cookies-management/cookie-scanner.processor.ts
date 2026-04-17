import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as puppeteer from 'puppeteer';
import { classifyCookie } from './cookie-dictionary.util';
import { ScanStatus, ScanDepth } from '@prisma/client';

export interface CookieScanJobData {
  websiteId: string;
}

@Processor('cookie-scanner')
export class CookieScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(CookieScannerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
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
    const maxPages = website.depth === ScanDepth.DEEP ? 50 : 10;
    const discoveredCookies = new Map<string, any>();

    try {
      // 1. Update status
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS }
      });

      // 2. Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions'
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Proteccio-Professional-Crawler/1.0 (Professional Cookie Compliance Scanner)');

      // 3. Crawling Loop (BFS)
      while (queue.length > 0 && visited.size < maxPages) {
        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;

        visited.add(currentUrl);
        this.logger.log(`[Crawling] ${visited.size}/${maxPages}: ${currentUrl}`);

        try {
          await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Capture Cookies (Includes JS and HTTP cookies)
          const cookies = await page.cookies();
          for (const cookie of cookies) {
            if (!discoveredCookies.has(cookie.name)) {
              discoveredCookies.set(cookie.name, {
                ...cookie,
                foundOn: currentUrl
              });
            }
          }

          // Extract more links if we haven't reached the limit
          if (visited.size < maxPages) {
            const links = await page.$$eval('a', (anchors) => 
              anchors.map(a => a.href).filter(href => href.startsWith('http'))
            );

            const baseUrl = new URL(website.url);
            for (const link of links) {
              try {
                const linkUrl = new URL(link);
                // Only crawl the same domain
                if (linkUrl.hostname === baseUrl.hostname && !visited.has(link)) {
                  queue.push(link);
                }
              } catch { /* Invalid URL */ }
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
        }
      }

      // 4. Process Discovered Cookies
      const results: any[] = [];
      const categoryCounts: Record<string, number> = {
        NECESSARY: 0,
        FUNCTIONAL: 0,
        ANALYTICS: 0,
        MARKETING: 0,
        UNCATEGORIZED: 0
      };

      for (const [name, cookie] of discoveredCookies.entries()) {
        const info = classifyCookie(name);
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
            data: { categoryId: category.id, description: info.description }
          });
        } else {
          const inventory = await this.prisma.cookieInventory.create({
            data: {
              name: name.trim(),
              domain: website.url,
              categoryId: category.id,
              description: info.description,
              expiration: cookie.expires ? new Date(cookie.expires * 1000).toLocaleDateString() : 'Session',
              tenantId: website.tenantId
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
          lastScan: new Date()
        }
      });

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
          }
        );
      }

      this.logger.log(`Professional Scan complete for ${website.url}. Pages: ${visited.size}, Cookies: ${discoveredCookies.size}`);
      return { cookiesFound: discoveredCookies.size, pagesScanned: visited.size };

    } catch (error) {
      this.logger.error(`Scan failed for ${website.url}: ${error.message}`);
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.FAILED }
      });
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}
