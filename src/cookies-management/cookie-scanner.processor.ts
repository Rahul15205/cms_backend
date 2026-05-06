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
    const startTime = Date.now();
    this.logger.log(`Starting Advanced Professional Scan for website: ${websiteId}`);

    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    // 1. Smart Configuration based on Depth
    const isDeep = website.depth === ScanDepth.DEEP;
    const MAX_PAGES = isDeep ? 100000 : 100;
    const CONCURRENCY = isDeep ? 10 : 5;
    const TIME_BUDGET_MS = isDeep ? 60 * 60 * 1000 : 15 * 60 * 1000; // 60 mins for DEEP, 15 mins for STANDARD
    const DEFAULT_WAIT_MS = isDeep ? 1000 : 500;

    let browser: puppeteer.Browser | null = null;
    const visited = new Set<string>();
    const enqueued = new Set<string>();
    const queue: string[] = [website.url];
    enqueued.add(website.url);
    
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
      hasCategorization: false,
      dsarEvidence: undefined as any,
      optOutEvidence: undefined as any,
      thirdPartyEvidence: undefined as any,
      categorizationEvidence: undefined as any,
      grievanceEvidence: undefined as any,
    };

    try {
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS }
      });

      // 2. Browser Launch Options
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      // 3. Setup Authenticated Context if needed
      const context = browser.defaultBrowserContext();
      
      if (website.scanBehindLogin && website.loginUrl && website.loginUsername && website.loginPassword) {
        this.logger.log(`Performing Login for ${website.url}`);
        const loginPage = await context.newPage();
        try {
          await loginPage.goto(website.loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          const userField = website.loginUserField || 'input[type="text"], input[type="email"], input[name="username"]';
          const passField = website.loginPassField || 'input[type="password"]';
          await loginPage.waitForSelector(userField, { timeout: 10000 });
          await loginPage.type(userField, website.loginUsername);
          await loginPage.type(passField, website.loginPassword);
          await Promise.all([
            loginPage.keyboard.press('Enter'),
            loginPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
          ]);
          this.logger.log(`Login successful for ${website.url}`);
        } catch (loginErr) {
          this.logger.error(`Login failed for ${website.url}: ${loginErr.message}`);
        } finally {
          await loginPage.close();
        }
      }

      // 4. Concurrency Queue Execution
      let lastDbUpdateTime = Date.now();

      const processPage = async (currentUrl: string, page: puppeteer.Page) => {
        try {
          // Identify if it's a key policy page
          const isPrivacyPage = /privacy(-)?policy|privacy/i.test(currentUrl);
          const isCookiePage = /cookie(-)?policy|cookie(-)?notice/i.test(currentUrl);
          const isCompliancePage = /compliance|legal|grievance/i.test(currentUrl);
          const isKeyPage = visited.size <= 3 || isPrivacyPage || isCookiePage || isCompliancePage;

          // Navigation optimization
          try {
             // 15s timeout for fast loads. If it times out, the DOM might still be partially ready.
             await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          } catch (e) {
             // Catch and proceed instead of adding another 30 seconds of waiting.
             // Often cookies and basic DOM are available even if it didn't fully finish.
          }

          // Trigger interaction
          await page.evaluate(() => window.scrollBy(0, 1000));
          await new Promise(r => setTimeout(r, isKeyPage ? 2000 : DEFAULT_WAIT_MS));

          // Auto-Accept Consent Banner
          try {
            const clicked = await page.evaluate(() => {
              const selectors = [
                '#onetrust-accept-btn-handler',
                'button[id*="accept" i]',
                'button[class*="accept" i]',
                'button[aria-label*="accept" i]',
                'a[id*="accept" i]',
                'a[class*="accept" i]'
              ];
              for (const sel of selectors) {
                const btn = document.querySelector(sel) as HTMLElement;
                if (btn && btn.offsetHeight > 0) { btn.click(); return true; }
              }
              const buttons = Array.from(document.querySelectorAll('button, a'));
              for (const btn of buttons) {
                const text = (btn.textContent || '').trim().toLowerCase();
                if (['accept', 'allow all', 'i agree', 'accept all', 'accept all cookies'].includes(text)) {
                   const el = btn as HTMLElement;
                   if (el.offsetHeight > 0) { el.click(); return true; }
                }
              }
              return false;
            });
            if (clicked) {
              await new Promise(r => setTimeout(r, 2000));
            }
          } catch (e) {}

          // Single DOM Evaluation
          const domData = await page.evaluate((isKey: boolean) => {
             const scripts = Array.from(document.querySelectorAll('script[src]')).map((e: any) => e.src);
             const links = Array.from(document.querySelectorAll('a')).map((a: any) => a.href).filter(href => href.startsWith('http'));
             const lang = document.documentElement.lang;
             const bodyText = isKey ? document.body.innerText.toLowerCase() : '';
             return { scripts, links, lang, bodyText };
          }, isKeyPage);

          if (domData.lang && domData.lang !== 'en') complianceSignals.hasLocalization = true;

          // Text analysis only on key pages
          if (isKeyPage && domData.bodyText) {
             const text = domData.bodyText;
             const extractEvidence = (keyword: string) => {
               const index = text.indexOf(keyword);
               if (index === -1) return "";
               const start = Math.max(0, index - 40);
               const end = Math.min(text.length, index + 100);
               return "..." + text.substring(start, end).replace(/\n/g, ' ').trim() + "...";
             };

             if (isPrivacyPage || isCookiePage) {
                if (text.includes('dsar') || text.includes('data subject access') || text.includes('your rights')) {
                  complianceSignals.hasDsar = true;
                  complianceSignals.dsarEvidence = { url: currentUrl, snippet: extractEvidence('dsar') || extractEvidence('data') };
                }
                if (text.includes('opt-out') || text.includes('withdraw') || text.includes('unsubscribe')) {
                  complianceSignals.hasOptOut = true;
                  complianceSignals.optOutEvidence = { url: currentUrl, snippet: extractEvidence('opt-out') || extractEvidence('withdraw') };
                }
                if (text.includes('third party') || text.includes('disclosure') || text.includes('share data')) {
                  complianceSignals.hasThirdPartyDisclosure = true;
                  complianceSignals.thirdPartyEvidence = { url: currentUrl, snippet: extractEvidence('third party') || extractEvidence('disclosure') };
                }
                if (isCookiePage && (text.includes('necessary') || text.includes('analytics') || text.includes('marketing'))) {
                  complianceSignals.hasCategorization = true;
                  complianceSignals.categorizationEvidence = { url: currentUrl, snippet: extractEvidence('necessary') || extractEvidence('analytics') };
                }
             }
             if (isPrivacyPage || isCompliancePage) {
                if (text.includes('grievance') || text.includes('complaint') || text.includes('nodal officer')) {
                  complianceSignals.hasGrievance = true;
                  complianceSignals.grievanceEvidence = { url: currentUrl, snippet: extractEvidence('grievance') || extractEvidence('complaint') };
                }
             }
          }

          // Capture Cookies
          // [CURRENT LIMITATION] page.cookies() only captures cookies accessible to the document 
          // and for the current domain. 
          // [FUTURE UPGRADE PATH] Migrate to CDP: 
          // const client = await page.target().createCDPSession();
          // const { cookies } = await client.send('Network.getAllCookies');
          const cookies = await page.cookies();
          for (const cookie of cookies) {
            if (!discoveredCookies.has(cookie.name)) {
              discoveredCookies.set(cookie.name, { ...cookie, foundOn: currentUrl });
            }
          }

          // Third-party detection
          const wUrl = new URL(website.url);
          domData.scripts.forEach(s => {
             try {
                const sUrl = new URL(s);
                if (sUrl.hostname !== wUrl.hostname) thirdPartyScriptsSet.add(sUrl.hostname);
             } catch {}
          });

          // Enqueue new links
          const blockedPatterns = ['logout', 'calendar', 'search', 'filter', 'sort=', 'page='];
          for (const link of domData.links) {
             try {
               const linkUrl = new URL(link);
               linkUrl.hash = '';
               // Aggressively remove known infinite loop params
               linkUrl.searchParams.delete('session');
               linkUrl.searchParams.delete('ref');
               linkUrl.searchParams.delete('utm_source');
               linkUrl.searchParams.delete('utm_medium');
               linkUrl.searchParams.delete('utm_campaign');
               
               let normalizedLink = linkUrl.href;
               if (normalizedLink.endsWith('/')) normalizedLink = normalizedLink.slice(0, -1);

               if (linkUrl.hostname === wUrl.hostname && !enqueued.has(normalizedLink)) {
                 const isBlocked = blockedPatterns.some(bp => normalizedLink.toLowerCase().includes(bp));
                 if (!isBlocked && queue.length < 5000) {
                   enqueued.add(normalizedLink);
                   queue.push(normalizedLink);
                 }
               }
             } catch {}
          }
        } catch (err) {
          this.logger.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
        }
      };

      const workerPages = await Promise.all(Array(CONCURRENCY).fill(0).map(async () => {
         const p = await context.newPage();
         await p.setViewport({ width: 1280, height: 800 });
         await p.setUserAgent('Proteccio-Scanner/1.2 (Optimized)');
         await p.setRequestInterception(true);
         
         const cmpWhitelist = ['onetrust.com', 'cookiebot.com', 'trustarc.com', 'didomi.io', 'iubenda.com', 'usercentrics.eu'];
         
         p.on('request', (req) => {
            const type = req.resourceType();
            const url = req.url();
            const isWhitelisted = cmpWhitelist.some(cmp => url.includes(cmp));
            
            if (['image', 'font', 'media'].includes(type)) {
               req.abort();
            } else if (type === 'stylesheet' && !isWhitelisted) {
               req.abort(); // Block aggressively
            } else {
               req.continue();
            }
         });
         return p;
      }));

      // Worker loop
      const worker = async (page: puppeteer.Page) => {
         while (queue.length > 0 && visited.size < MAX_PAGES) {
            if (Date.now() - startTime > TIME_BUDGET_MS) break; // Time budget check

            const currentUrl = queue.shift();
            if (!currentUrl) continue;
            
            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            await processPage(currentUrl, page);

            // Throttle progress updates (every 5 seconds)
            if (Date.now() - lastDbUpdateTime > 5000) {
               lastDbUpdateTime = Date.now();
               try {
                 await this.prisma.scannedWebsite.update({
                   where: { id: websiteId },
                   data: { pagesCrawled: visited.size, cookiesDetected: discoveredCookies.size }
                 });
               } catch (e) {}
            }
         }
      };

      // Run workers concurrently
      await Promise.all(workerPages.map(p => worker(p)));

      // Cleanup worker pages
      await Promise.all(workerPages.map(p => p.close().catch(() => {})));

      // 5. Process Discovered Cookies (Optimized DB Ops)
      const categoryCounts: Record<string, number> = {
        NECESSARY: 0, FUNCTIONAL: 0, ANALYTICS: 0, MARKETING: 0, UNCATEGORIZED: 0
      };

      // Preload categories
      const categoriesMap = new Map<string, string>(); // categoryName -> categoryId
      const existingCategories = await this.prisma.cookieCategory.findMany({ where: { tenantId: website.tenantId } });
      existingCategories.forEach(c => categoriesMap.set(c.category, c.id));

      const newInventoryItems: any[] = [];
      const updateInventoryItems: any[] = [];
      
      const existingCookies = await this.prisma.cookieInventory.findMany({
         where: { domain: website.url, tenantId: website.tenantId },
         select: { id: true, name: true }
      });
      const existingCookiesMap = new Map<string, string>();
      existingCookies.forEach(c => existingCookiesMap.set(c.name, c.id));

      for (const [name, cookie] of discoveredCookies.entries()) {
        let info = { category: 'UNCATEGORIZED' as any, description: 'Unknown cookie discovered during scan.' };
        if (website.autoCategorize) info = classifyCookie(name);

        categoryCounts[info.category]++;

        let catId = categoriesMap.get(info.category);
        if (!catId) {
          const newCat = await this.prisma.cookieCategory.create({
            data: { name: info.category, category: info.category, tenantId: website.tenantId }
          });
          catId = newCat.id;
          categoriesMap.set(info.category, catId);
        }

        const exp = cookie.expires ? new Date(cookie.expires * 1000).toLocaleDateString() : 'Session';

        if (existingCookiesMap.has(name)) {
           updateInventoryItems.push({
             where: { id: existingCookiesMap.get(name)! },
             data: { categoryId: catId, description: info.description, websiteId }
           });
        } else {
           newInventoryItems.push({
             name: name.trim(), domain: website.url, categoryId: catId!,
             description: info.description, expiration: exp,
             tenantId: website.tenantId, websiteId
           });
        }
      }

      // Execute bulk DB operations
      if (newInventoryItems.length > 0) {
         await this.prisma.cookieInventory.createMany({ data: newInventoryItems, skipDuplicates: true });
      }
      for (const update of updateInventoryItems) {
         await this.prisma.cookieInventory.update(update);
      }

      // 6. Finalize Scan
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { 
          status: ScanStatus.COMPLETED, lastScan: new Date(),
          pagesCrawled: visited.size, cookiesDetected: discoveredCookies.size,
        }
      });

      await this.complianceScanner.evaluateCompliance(
         websiteId, discoveredCookies.size, Array.from(visited),
         Array.from(thirdPartyScriptsSet), complianceSignals
      );

      const updatedWebsite = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });

      // 7. Notification
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
          website.email, website.name,
          {
            isPeriodic, userName: website.pocName || website.name || 'Website Owner',
            websiteUrl: website.url, complianceScore: updatedWebsite?.complianceScore || 0,
            riskScore: 100 - (updatedWebsite?.complianceScore || 0), riskLevel: updatedWebsite?.riskLevel || 'N/A',
            previousScore: website.complianceScore || 0,
            scoreDifference: (updatedWebsite?.complianceScore || 0) - (website.complianceScore || 0),
            totalPages: visited.size, scanType: website.depth, scanFrequency: website.frequency,
            scanDate: new Date().toLocaleString(), cookieCount: discoveredCookies.size,
            necessaryCount: categoryCounts['NECESSARY'], functionalCount: categoryCounts['FUNCTIONAL'],
            analyticsCount: categoryCounts['ANALYTICS'], marketingCount: categoryCounts['MARKETING'],
            unknownCount: categoryCounts['UNCATEGORIZED'], thirdPartyDomains: Array.from(thirdPartyScriptsSet),
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
            keyRisks, recommendedActions, changesDetected
          }
        );
      }

      this.logger.log(`Optimized Scan complete for ${website.url}. Pages: ${visited.size}, Cookies: ${discoveredCookies.size}`);
      return { cookiesFound: discoveredCookies.size, pagesScanned: visited.size };

    } catch (error) {
      this.logger.error(`Scan failed for website ${websiteId}: ${error.message}`);
      try {
        await this.prisma.scannedWebsite.update({
          where: { id: websiteId }, data: { status: ScanStatus.FAILED }
        });
      } catch (dbError) {}
      throw error;
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }
}
