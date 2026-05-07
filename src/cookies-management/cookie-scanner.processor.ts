import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as puppeteer from 'puppeteer';
import { CookieClassifierService } from './cookie-classifier.service';
import { ScanStatus, ScanDepth } from '@prisma/client';
import { ComplianceScannerService } from './compliance-scanner.service';

/**
 * Normalizes a URL to prevent duplicate crawling of the same content with different tracking parameters.
 */
function normalizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.hash = '';
    // Remove common tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid'];
    for (const param of paramsToRemove) {
      parsed.searchParams.delete(param);
    }
    parsed.searchParams.sort(); // Consistent parameter ordering
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.href.toLowerCase();
  } catch {
    return urlStr;
  }
}

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
    private readonly cookieClassifier: CookieClassifierService,
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
    let context: puppeteer.BrowserContext | null = null;
    
    const visited = new Set<string>();
    const enqueued = new Set<string>();
    
    const normalizedStart = normalizeUrl(website.url);
    const queue: string[] = [normalizedStart];
    enqueued.add(normalizedStart);
    
    const maxPages = website.depth === ScanDepth.DEEP ? Infinity : 100;
    const MAX_SCAN_TIME_MS = website.depth === ScanDepth.DEEP ? 30 * 60 * 1000 : 10 * 60 * 1000; // 30 mins deep, 10 mins fast/balanced
    const scanStartTime = Date.now();
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

      // Create an isolated context for this scan to prevent data leakage
      context = await browser.createBrowserContext();

      const page = await context.newPage();
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

      // 4. Crawling Loop (Optimized for Speed via Context Pooling)
      // We process pages in batches to control concurrency.
      const CONCURRENCY = website.depth === ScanDepth.DEEP ? 8 : 5; 
      
      while (queue.length > 0 && visited.size < maxPages) {
        // Time budget check
        if (Date.now() - scanStartTime > MAX_SCAN_TIME_MS) {
          this.logger.warn(`Scan for ${website.url} exceeded time budget (${MAX_SCAN_TIME_MS}ms). Stopping crawl.`);
          break;
        }

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

          const page = await context!.newPage();
          try {
            // CDP Setup for Set-Cookie header interception
            const cdpSession = await page.target().createCDPSession();
            await cdpSession.send('Network.enable');

            const setCookieHeaders: string[] = [];
            cdpSession.on('Network.responseReceived', (params) => {
              const headers = params.response.headers;
              const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
              if (setCookie) {
                const cookiesArray = Array.isArray(setCookie) ? setCookie : setCookie.split('\n');
                setCookieHeaders.push(...cookiesArray);
              }
            });

            // Aggressive Blocking for Speed: Block everything visual since we only care about cookies/scripts
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              const type = req.resourceType();
              // Allow documents, scripts, and fetch/xhr (for API calls that might set cookies). Block the rest.
              if (['image', 'font', 'media', 'stylesheet', 'websocket'].includes(type)) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Proteccio-Scanner/2.0');

            this.logger.log(`[Scanning] ${visited.size}/${maxPages === Infinity ? '∞' : maxPages}: ${currentUrl}`);
            
            // Smart Navigation: Use networkidle2, but if it takes too long, just proceed. We don't need a perfect visual render.
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Interaction: Scroll slightly to trigger 'on-scroll' lazy loaded scripts
            await page.evaluate(() => window.scrollBy(0, 1000));
            
            // CMP Interaction: Auto-click "Accept All" banners to trigger marketing cookies
            try {
              const CMP_SELECTORS = [
                '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
                '#onetrust-accept-btn-handler', // OneTrust
                '.cky-btn-accept', // CookieYes
                '.osano-cm-accept-all', // Osano
                '.iubenda-cs-accept-btn', // Iubenda
                'button[id*="accept" i]', 'button[class*="accept" i]',
                'a[id*="accept" i]', '[data-action="accept" i]',
                'button:has-text("Accept All")', 'button:has-text("Accept Cookies")',
                'button:has-text("I Agree")', 'button:has-text("Got it")',
                'button:has-text("Allow All")'
              ];

              for (const selector of CMP_SELECTORS) {
                const clicked = await page.evaluate((sel) => {
                  let btn = document.querySelector(sel) as HTMLElement;
                  // Handle custom :has-text pseudo-class since it's not standard CSS
                  if (!btn && sel.includes(':has-text')) {
                    const textToFind = sel.match(/:has-text\("(.*?)"\)/)?.[1]?.toLowerCase();
                    if (textToFind) {
                      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
                      btn = buttons.find(b => b.textContent?.toLowerCase().includes(textToFind)) as HTMLElement;
                    }
                  }
                  if (btn && btn.offsetHeight > 0) { // Only click if visible
                    btn.click();
                    return true;
                  }
                  return false;
                }, selector);

                if (clicked) {
                  // Wait a short moment specifically for the banner click to register before standard network wait
                  await new Promise(r => setTimeout(r, 500));
                  break;
                }
              }
            } catch (e) {
              // Ignore CMP interaction errors (e.g., cross-origin frame issues)
            }
            
            // Detect Page Types for Compliance
            const isPrivacyPage = /privacy(-)?policy|privacy/i.test(currentUrl);
            const isCookiePage = /cookie(-)?policy|cookie(-)?notice/i.test(currentUrl);
            const isCompliancePage = /compliance|legal|grievance/i.test(currentUrl);

            // Smart Wait: Instead of hard setTimeout, wait until network is idle, with a max hard cap
            try {
              const isKeyPage = visited.size <= 3 || isPrivacyPage || isCookiePage || isCompliancePage;
              const maxWaitMs = isKeyPage ? 5000 : 2000; 
              
              // Wait for network to settle after DOM load (scripts firing)
              await Promise.race([
                 page.waitForNetworkIdle({ idleTime: 500, timeout: maxWaitMs }),
                 new Promise(resolve => setTimeout(resolve, maxWaitMs)) // hard cap
              ]);
            } catch (e) {
              // Ignore wait errors
            }
            
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

            // 1. Capture HTTP Cookies
            const cookies = await page.cookies();
            for (const cookie of cookies) {
              if (!discoveredCookies.has(cookie.name)) {
                discoveredCookies.set(cookie.name, { ...cookie, foundOn: currentUrl, type: 'HTTP_COOKIE' });
              }
            }

            // 2. Capture Network Set-Cookie Headers
            for (const headerStr of setCookieHeaders) {
              const parts = headerStr.split(';');
              const nameValue = parts[0].split('=');
              if (nameValue.length >= 2) {
                const name = nameValue[0].trim();
                if (!discoveredCookies.has(name)) {
                   discoveredCookies.set(name, { name, value: nameValue[1], domain: currentUrl, type: 'HTTP_COOKIE' });
                }
              }
            }

            // 3. Capture LocalStorage & SessionStorage
            const storageData = await page.evaluate(() => {
              const ls: Record<string, string> = {};
              const ss: Record<string, string> = {};
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key) ls[key] = 'hidden';
                }
                for (let i = 0; i < sessionStorage.length; i++) {
                  const key = sessionStorage.key(i);
                  if (key) ss[key] = 'hidden';
                }
              } catch (e) {}
              return { localStorage: ls, sessionStorage: ss };
            });

            for (const key of Object.keys(storageData.localStorage)) {
              const mapKey = `[LS] ${key}`;
              if (!discoveredCookies.has(mapKey)) {
                discoveredCookies.set(mapKey, { name: key, type: 'LOCAL_STORAGE', foundOn: currentUrl });
              }
            }
            for (const key of Object.keys(storageData.sessionStorage)) {
              const mapKey = `[SS] ${key}`;
              if (!discoveredCookies.has(mapKey)) {
                discoveredCookies.set(mapKey, { name: key, type: 'SESSION_STORAGE', foundOn: currentUrl });
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
                const normalizedLink = normalizeUrl(link);
                const linkUrl = new URL(normalizedLink);

                if (linkUrl.hostname === baseUrl.hostname && !visited.has(normalizedLink) && !enqueued.has(normalizedLink)) {
                  // Prioritize policy pages by putting them at the front of the queue
                  if (/privacy|cookie|legal|terms/i.test(normalizedLink)) {
                    queue.unshift(normalizedLink);
                  } else {
                    queue.push(normalizedLink);
                  }
                  enqueued.add(normalizedLink);
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

      if (context) await context.close();

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
          try {
             const hostname = new URL(website.url).hostname;
             let classification;
             let realName = name;
             
             if (name.startsWith('[LS] ') || cookie.type === 'LOCAL_STORAGE') {
                realName = name.replace('[LS] ', '');
                classification = this.cookieClassifier.classifyStorageKey(realName, 'localStorage');
             } else if (name.startsWith('[SS] ') || cookie.type === 'SESSION_STORAGE') {
                realName = name.replace('[SS] ', '');
                classification = this.cookieClassifier.classifyStorageKey(realName, 'sessionStorage');
             } else {
                classification = this.cookieClassifier.classify(realName, hostname);
             }
             
             info = {
               category: classification.category as any,
               description: classification.description
             };
          } catch (e) {
             const classification = this.cookieClassifier.classify(name);
             info = {
               category: classification.category as any,
               description: classification.description
             };
          }
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
         complianceSignals,
         Array.from(discoveredCookies.values())
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
