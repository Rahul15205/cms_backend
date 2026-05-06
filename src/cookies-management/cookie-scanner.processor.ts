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
    const enqueued = new Set<string>();
    const queue: string[] = [website.url];
    enqueued.add(website.url);
    const maxPages = website.depth === ScanDepth.DEEP ? Infinity : 100;
    const discoveredCookies = new Map<string, any>();
    const thirdPartyScriptsSet = new Set<string>();
    const complianceSignals: {
      hasPrivacyPolicy: boolean;
      hasCookieNotice: boolean;
      hasComplianceNotice: boolean;
      hasDsar: boolean;
      hasGrievance: boolean;
      hasOptOut: boolean;
      hasThirdPartyDisclosure: boolean;
      hasLocalization: boolean;
      hasCategorization: boolean;
      dsarEvidence?: { url: string; snippet: string };
      optOutEvidence?: { url: string; snippet: string };
      thirdPartyEvidence?: { url: string; snippet: string };
      categorizationEvidence?: { url: string; snippet: string };
      grievanceEvidence?: { url: string; snippet: string };
    } = {
      hasPrivacyPolicy: false,
      hasCookieNotice: false,
      hasComplianceNotice: false,
      hasDsar: false,
      hasGrievance: false,
      hasOptOut: false,
      hasThirdPartyDisclosure: false,
      hasLocalization: false,
      hasCategorization: false,
    };

    try {
      // 1. Update status
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS }
      });

      // 2. Launch Puppeteer with stable settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu'
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Proteccio-Scanner/1.1');

      // 3. Optional Login (Restored)
      if (website.scanBehindLogin && website.loginUrl && website.loginUsername && website.loginPassword) {
        this.logger.log(`Performing Scan-Behind-Login for ${website.url} at ${website.loginUrl}`);
        try {
          await page.goto(website.loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          
          const userField = website.loginUserField || 'input[type="text"], input[type="email"], input[name="username"]';
          const passField = website.loginPassField || 'input[type="password"]';
          
          await page.waitForSelector(userField, { timeout: 10000 });
          await page.type(userField, website.loginUsername);
          await page.type(passField, website.loginPassword);
          
          // Find and click submit button
          await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
          ]);
          
          this.logger.log(`Login successful for ${website.url}`);
        } catch (loginErr) {
          this.logger.error(`Login failed for ${website.url}: ${loginErr.message}`);
        }
      }
      await page.close(); // Close login page, we will open fresh ones for crawling

      // 4. Crawling Loop (Balanced for Speed vs Accuracy)
      const CONCURRENCY = 5; 
      
      while (queue.length > 0 && visited.size < maxPages) {
        const batch: string[] = [];
        while (queue.length > 0 && batch.length < CONCURRENCY && (visited.size + batch.length) < maxPages) {
          const next = queue.shift()!;
          if (!visited.has(next)) batch.push(next);
        }

        if (batch.length === 0) continue;

        // Existence check once per batch
        const websiteCheck = await this.prisma.scannedWebsite.findUnique({
          where: { id: websiteId },
          select: { id: true }
        });

        if (!websiteCheck) {
          this.logger.warn(`Website ${websiteId} was deleted during scan. Aborting process.`);
          if (browser) await browser.close();
          return { status: 'ABORTED', reason: 'Website deleted' };
        }

        await Promise.all(batch.map(async (currentUrl) => {
          if (visited.has(currentUrl)) return;
          visited.add(currentUrl);

          const page = await browser!.newPage();
          try {
            // Balanced Blocking: Keep stylesheets as they are often needed for JS-based banners
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              const type = req.resourceType();
              if (['image', 'font', 'media', 'other'].includes(type)) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Proteccio-Scanner/1.1');

            // Reliable Load: Use 'load' and a small wait for all pages
            const waitCondition = visited.size <= 1 ? 'networkidle2' : 'load';
            this.logger.log(`[Scanning] ${visited.size}/${maxPages}: ${currentUrl} (Mode: Balanced)`);
            
            await page.goto(currentUrl, { waitUntil: waitCondition, timeout: 45000 });
            
            // Interaction: Scroll slightly to trigger 'on-scroll' scripts
            await page.evaluate(() => window.scrollBy(0, 1000));
            
            // Detect Page Types
            const isPrivacyPage = /privacy(-)?policy|privacy/i.test(currentUrl);
            const isCookiePage = /cookie(-)?policy|cookie(-)?notice/i.test(currentUrl);
            const isCompliancePage = /compliance|legal|grievance/i.test(currentUrl);

            // Dynamic Wait Time: 2s for first 3 pages and policy pages, 500ms for others
            const isKeyPage = visited.size <= 3 || isPrivacyPage || isCookiePage || isCompliancePage;
            const waitTime = isKeyPage ? 2000 : 500;
            
            // Wait for JS execution
            await new Promise(r => setTimeout(r, waitTime));
            
            // Global check for localization (html lang)
            const lang = await page.evaluate(() => document.documentElement.lang);
            if (lang && lang !== 'en') complianceSignals.hasLocalization = true;

            if (isPrivacyPage) complianceSignals.hasPrivacyPolicy = true;
            if (isCookiePage) complianceSignals.hasCookieNotice = true;
            if (isCompliancePage) complianceSignals.hasComplianceNotice = true;

            // Deep Content Scan
            const pageText = await page.evaluate(() => document.body.innerText);
            const lowerText = pageText.toLowerCase();

            const extractEvidence = (text: string, keyword: string) => {
               const index = text.toLowerCase().indexOf(keyword.toLowerCase());
               if (index === -1) return "";
               const start = Math.max(0, index - 40);
               const end = Math.min(text.length, index + 100);
               return "..." + text.substring(start, end).replace(/\n/g, ' ').trim() + "...";
            };

            if (isPrivacyPage || isCookiePage) {
               if (lowerText.includes('dsar') || lowerText.includes('data subject access') || lowerText.includes('your rights')) {
                 complianceSignals.hasDsar = true;
                 complianceSignals.dsarEvidence = { url: currentUrl, snippet: extractEvidence(pageText, 'dsar') || extractEvidence(pageText, 'data') };
               }
               if (lowerText.includes('opt-out') || lowerText.includes('withdraw') || lowerText.includes('unsubscribe')) {
                 complianceSignals.hasOptOut = true;
                 complianceSignals.optOutEvidence = { url: currentUrl, snippet: extractEvidence(pageText, 'opt-out') || extractEvidence(pageText, 'withdraw') };
               }
               if (lowerText.includes('third party') || lowerText.includes('disclosure') || lowerText.includes('share data')) {
                 complianceSignals.hasThirdPartyDisclosure = true;
                 complianceSignals.thirdPartyEvidence = { url: currentUrl, snippet: extractEvidence(pageText, 'third party') || extractEvidence(pageText, 'disclosure') };
               }
               if (isCookiePage && (lowerText.includes('necessary') || lowerText.includes('analytics') || lowerText.includes('marketing'))) {
                 complianceSignals.hasCategorization = true;
                 complianceSignals.categorizationEvidence = { url: currentUrl, snippet: extractEvidence(pageText, 'necessary') || extractEvidence(pageText, 'analytics') };
               }
            }

            if (isPrivacyPage || isCompliancePage) {
               if (lowerText.includes('grievance') || lowerText.includes('complaint') || lowerText.includes('nodal officer')) {
                 complianceSignals.hasGrievance = true;
                 complianceSignals.grievanceEvidence = { url: currentUrl, snippet: extractEvidence(pageText, 'grievance') || extractEvidence(pageText, 'complaint') };
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
                // URL Normalization: Remove hash fragment to avoid crawling same page twice
                linkUrl.hash = '';
                const normalizedLink = linkUrl.href;

                if (linkUrl.hostname === baseUrl.hostname && !visited.has(normalizedLink) && !enqueued.has(normalizedLink)) {
                  enqueued.add(normalizedLink);
                  queue.push(normalizedLink);
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
        const isPeriodic = !!website.lastScan;
        const indicators = updatedWebsite?.scanResults as any[] || [];

        const getStatus = (id: string) => {
          const ind = indicators.find(i => i.id === id);
          if (!ind) return { icon: '✖', text: 'Missing' };
          if (ind.passed) return { icon: '✔', text: 'Present' };
          return { icon: '✖', text: 'Missing' };
        };

        const keyRisks = indicators.filter(i => !i.passed).map(i => i.name + ' issue detected.').slice(0, 5);
        const recommendedActions = indicators.filter(i => !i.passed).map(i => `Implement or fix ${i.name}`).slice(0, 5);

        const changesDetected: string[] = [];
        if (website.lastScan && updatedWebsite?.complianceScore !== website.complianceScore) {
          changesDetected.push(`Compliance score changed from ${website.complianceScore || 0}% to ${updatedWebsite?.complianceScore}%`);
        }

        await this.notificationsService.sendCookieScanCompletionEmail(
          website.email,
          website.name,
          {
            isPeriodic,
            userName: website.pocName || website.name || 'Website Owner',
            websiteUrl: website.url,
            complianceScore: updatedWebsite?.complianceScore || 0,
            riskScore: 100 - (updatedWebsite?.complianceScore || 0),
            riskLevel: updatedWebsite?.riskLevel || 'N/A',
            previousScore: website.complianceScore || 0,
            scoreDifference: (updatedWebsite?.complianceScore || 0) - (website.complianceScore || 0),
            totalPages: visited.size,
            scanType: website.depth,
            scanFrequency: website.frequency,
            scanDate: new Date().toLocaleString(),
            cookieCount: discoveredCookies.size,
            necessaryCount: categoryCounts['NECESSARY'],
            functionalCount: categoryCounts['FUNCTIONAL'],
            analyticsCount: categoryCounts['ANALYTICS'],
            marketingCount: categoryCounts['MARKETING'],
            unknownCount: categoryCounts['UNCATEGORIZED'],
            thirdPartyDomains: Array.from(thirdPartyScriptsSet),
            bannerIcon: getStatus('banner_installed').icon, bannerText: getStatus('banner_installed').text,
            categorizationIcon: getStatus('categorization').icon, categorizationText: getStatus('categorization').text,
            loggingIcon: getStatus('consent_logging').icon, loggingText: getStatus('consent_logging').text,
            privacyIcon: getStatus('privacy_policy').icon, privacyText: getStatus('privacy_policy').text,
            dsarIcon: getStatus('dsar').icon, dsarText: getStatus('dsar').text,
            httpsIcon: getStatus('https_security').icon, httpsText: getStatus('https_security').text,
            thirdPartyIcon: getStatus('third_party_disclosure').icon, thirdPartyText: getStatus('third_party_disclosure').text,
            optOutIcon: getStatus('opt_out').icon, optOutText: getStatus('opt_out').text,
            languageIcon: getStatus('language_support').icon, languageText: getStatus('language_support').text,
            grievanceIcon: getStatus('grievance_mechanism').icon, grievanceText: getStatus('grievance_mechanism').text,
            keyRisks,
            recommendedActions,
            changesDetected
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
