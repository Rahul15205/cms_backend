// cookie-scanner.processor.ts - OPTIMIZED VERSION

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as puppeteer from 'puppeteer';
import { CookieClassifierService } from './cookie-classifier.service';
import { ScanStatus, ScanDepth } from '@prisma/client';
import { ComplianceScannerService } from './compliance-scanner.service';

function normalizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.hash = '';
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid'];
    for (const param of paramsToRemove) parsed.searchParams.delete(param);
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.href.toLowerCase();
  } catch {
    return urlStr;
  }
}

// ─── Page Type Classification ──────────────────────────────────────────────
// Industry approach: classify pages by URL + content signals
// This drives conditional compliance scanning (OneTrust does exactly this)

export type PageType = 'HOME' | 'PRIVACY_POLICY' | 'COOKIE_POLICY' | 'COMPLIANCE' | 'GENERAL';

interface PageClassification {
  url: string;
  types: PageType[];
  title: string;
}

/**
 * Classify page type using URL patterns + page content.
 * URL-only classification misses CMS-hosted pages like /legal/privacy-center
 */
function classifyPageByUrl(url: string): PageType[] {
  const types: PageType[] = [];
  const lower = url.toLowerCase();

  if (/^\/?$|\/home|\/index/.test(lower) || new URL(url).pathname === '/') types.push('HOME');
  if (/privacy[-_]?policy|privacy[-_]?notice|datenschutz|privacidad/.test(lower)) types.push('PRIVACY_POLICY');
  if (/cookie[-_]?policy|cookie[-_]?notice|cookie[-_]?declaration/.test(lower)) types.push('COOKIE_POLICY');
  if (/compliance|legal|grievance|terms[-_]?of[-_]?(use|service)|gdpr|ccpa/.test(lower)) types.push('COMPLIANCE');

  return types.length ? types : ['GENERAL'];
}

/**
 * Classify page type from rendered content.
 * Handles CMS pages where URL slug doesn't reveal page type.
 * Check h1, title, and first 500 chars of body text.
 */
async function classifyPageByContent(page: puppeteer.Page, url: string): Promise<PageType[]> {
  try {
    const signals = await page.evaluate(() => {
      const title = document.title?.toLowerCase() || '';
      const h1 = document.querySelector('h1')?.textContent?.toLowerCase() || '';
      const h2 = document.querySelector('h2')?.textContent?.toLowerCase() || '';
      const bodyStart = document.body?.innerText?.substring(0, 800)?.toLowerCase() || '';
      return { title, h1, h2, bodyStart };
    });

    const combined = `${signals.title} ${signals.h1} ${signals.h2} ${signals.bodyStart}`;
    const types: PageType[] = [];

    if (/privacy policy|privacy notice|data protection|how we use.*data|personal.*information.*collect/.test(combined)) {
      types.push('PRIVACY_POLICY');
    }
    if (/cookie policy|cookie notice|cookie declaration|how we use cookies|types of cookies/.test(combined)) {
      types.push('COOKIE_POLICY');
    }
    if (/grievance|nodal officer|compliance officer|legal notice|terms of (use|service)/.test(combined)) {
      types.push('COMPLIANCE');
    }

    return types.length ? types : classifyPageByUrl(url);
  } catch {
    return classifyPageByUrl(url);
  }
}

// ─── Compliance Signal Extractors ──────────────────────────────────────────
// Each compliance indicator has specific pages it should check.
// This is the "conditional scanning" approach you mentioned.
//
// INDICATOR → RELEVANT PAGE TYPES (industry mapping):
//   cookie_banner        → scan ALL pages (it's a global element)
//   cookie_categorization→ COOKIE_POLICY (must list categories)
//   consent_logging      → COOKIE_POLICY, PRIVACY_POLICY (must mention logging)
//   privacy_policy       → PRIVACY_POLICY existence
//   dsar                 → PRIVACY_POLICY, COOKIE_POLICY (rights section)
//   https_security       → ALL pages (HTTP check)
//   third_party          → COOKIE_POLICY, PRIVACY_POLICY, HOME (disclosures)
//   opt_out              → PRIVACY_POLICY, COOKIE_POLICY (withdrawal mechanism)
//   language_support     → ALL pages (html lang attribute)
//   grievance            → PRIVACY_POLICY, COMPLIANCE (officer contact)

interface ComplianceSignals {
  hasPrivacyPolicy: boolean;
  hasCookieNotice: boolean;
  hasComplianceNotice: boolean;
  hasCmpBanner: boolean;         // NEW: proper CMP detected (not just any banner)
  hasDsar: boolean;
  hasGrievance: boolean;
  hasOptOut: boolean;
  hasThirdPartyDisclosure: boolean;
  hasLocalization: boolean;
  hasCategorization: boolean;
  hasConsentLogging: boolean;    // NEW: explicit mention of consent logging
  cmpProvider?: string;          // NEW: which CMP (OneTrust, Cookiebot, etc.)
  dsarEvidence?: { url: string; snippet: string };
  optOutEvidence?: { url: string; snippet: string };
  thirdPartyEvidence?: { url: string; snippet: string };
  categorizationEvidence?: { url: string; snippet: string };
  grievanceEvidence?: { url: string; snippet: string };
  bannerEvidence?: { url: string; snippet: string };
  privacyPolicyEvidence?: { url: string; snippet: string };
  languageEvidence?: { url: string; snippet: string };
  consentLoggingEvidence?: { url: string; snippet: string };
  httpsEvidence?: { url: string; snippet: string };
  secureFlagEvidence?: { cookieName: string };
  httpOnlyFlagEvidence?: { cookieName: string };
  expiryFlagEvidence?: { cookieName: string };
}

// Known CMP fingerprints — detect by DOM element or script
const CMP_FINGERPRINTS: { selector: string; name: string }[] = [
  { selector: '#CybotCookiebotDialog, script[src*="cookiebot"]', name: 'Cookiebot' },
  { selector: '#onetrust-banner-sdk, script[src*="onetrust"]', name: 'OneTrust' },
  { selector: '.cky-consent-container, script[src*="cookieyescdn"]', name: 'CookieYes' },
  { selector: '.osano-cm-window, script[src*="osano"]', name: 'Osano' },
  { selector: '[data-iubenda], script[src*="iubenda"]', name: 'Iubenda' },
  { selector: '.cc-window, script[src*="cookieconsent"]', name: 'Cookie Consent JS' },
  { selector: '#CookieConsent, script[src*="cookie-script"]', name: 'Cookie-Script' },
  { selector: 'script[src*="termly"]', name: 'Termly' },
  { selector: 'script[src*="usercentrics"]', name: 'Usercentrics' },
  { selector: 'script[src*="cookiehub"]', name: 'CookieHub' },
];

const CMP_ACCEPT_SELECTORS = [
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#onetrust-accept-btn-handler',
  '.cky-btn-accept',
  '.osano-cm-accept-all',
  '.iubenda-cs-accept-btn',
  'button[id*="accept" i]',
  'button[class*="accept" i]',
  '[data-action="accept" i]',
  ':has-text("Accept All")',
  ':has-text("Accept Cookies")',
  ':has-text("I Agree")',
  ':has-text("Allow All")',
  ':has-text("Got it")'
];

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
    this.logger.log(`Starting Optimized Scan for website: ${websiteId}`);

    const website = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });
    if (!website) throw new Error(`Website not found: ${websiteId}`);

    let browser: puppeteer.Browser | null = null;
    let context: puppeteer.BrowserContext | null = null;

    const visited = new Set<string>();
    const enqueued = new Set<string>();
    const normalizedStart = normalizeUrl(website.url);
    const queue: string[] = [normalizedStart];
    enqueued.add(normalizedStart);

    // Track page classifications for conditional compliance scanning
    const classifiedPages: PageClassification[] = [];

    const maxPages = website.depth === ScanDepth.DEEP ? Infinity : 100;
    const MAX_SCAN_TIME_MS = website.depth === ScanDepth.DEEP ? 30 * 60 * 1000 : 10 * 60 * 1000;
    const scanStartTime = Date.now();

    const discoveredCookies = new Map<string, any>();
    
    // FIX: Capture ALL network request domains (not just <script src>)
    // This catches fetch(), XHR, dynamic script injection, pixel tags, etc.
    const thirdPartyDomainsSet = new Set<string>();
    
    const complianceSignals: ComplianceSignals = {
      hasPrivacyPolicy: false,
      hasCookieNotice: false,
      hasComplianceNotice: false,
      hasCmpBanner: false,
      hasDsar: false,
      hasGrievance: false,
      hasOptOut: false,
      hasThirdPartyDisclosure: false,
      hasLocalization: false,
      hasCategorization: false,
      hasConsentLogging: false,
    };

    try {
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS },
      });

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      context = await browser.createBrowserContext();

      // ── Optional Login ──────────────────────────────────────────────────
      if (website.scanBehindLogin && website.loginUrl && website.loginUsername && website.loginPassword) {
        this.logger.log(`Login flow for ${website.url}`);
        const loginPage = await context.newPage();
        try {
          await loginPage.goto(website.loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          const userField = website.loginUserField || 'input[type="text"], input[type="email"]';
          const passField = website.loginPassField || 'input[type="password"]';
          await loginPage.waitForSelector(userField, { timeout: 10000 });
          await loginPage.type(userField, website.loginUsername);
          await loginPage.type(passField, website.loginPassword);
          await Promise.all([
            loginPage.keyboard.press('Enter'),
            loginPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
          ]);
          this.logger.log(`Login OK for ${website.url}`);
        } catch (e) {
          this.logger.error(`Login failed: ${e.message}`);
        } finally {
          await loginPage.close();
        }
      }

      const CONCURRENCY = website.depth === ScanDepth.DEEP ? 8 : 5;
      const baseUrl = new URL(website.url);
      const getBaseDomain = (hostname: string) => {
        const parts = hostname.split('.');
        if (parts.length <= 2) return hostname.toLowerCase().replace(/^www\./i, '');
        // Handle common TLDs like .co.in or .com.au
        const tld2 = parts.slice(-2).join('.').toLowerCase();
        if (['co.in', 'com.au', 'co.uk', 'org.in', 'net.in', 'co.nz', 'co.jp'].includes(tld2)) {
          return parts.slice(-3).join('.').toLowerCase().replace(/^www\./i, '');
        }
        return parts.slice(-2).join('.').toLowerCase().replace(/^www\./i, '');
      };
      let baseDomain = getBaseDomain(baseUrl.hostname);
      let baseHostname = baseUrl.hostname;

      // ── Main Crawl Loop ─────────────────────────────────────────────────
      while (queue.length > 0 && visited.size < maxPages) {
        if (Date.now() - scanStartTime > MAX_SCAN_TIME_MS) {
          this.logger.warn(`Time budget exceeded for ${website.url}. Stopping.`);
          break;
        }

        const batch: string[] = [];
        while (queue.length > 0 && batch.length < CONCURRENCY && (visited.size + batch.length) < maxPages) {
          const next = queue.shift()!;
          if (!visited.has(next)) batch.push(next);
        }
        if (!batch.length) continue;

        const websiteCheck = await this.prisma.scannedWebsite.findUnique({
          where: { id: websiteId },
          select: { id: true },
        });
        if (!websiteCheck) {
          this.logger.warn(`Website ${websiteId} deleted during scan. Aborting.`);
          if (browser) await browser.close();
          return { status: 'ABORTED', reason: 'Website deleted' };
        }

        await Promise.all(batch.map(async (currentUrl) => {
          if (visited.has(currentUrl)) return;
          visited.add(currentUrl);

          const page = await context!.newPage();
          try {
            // ── CDP: Intercept ALL network requests for third-party detection ──
            // This is how professional scanners detect third parties:
            // Ghostery, Cookiebot etc. use network-level interception, not DOM scraping
            const cdpSession = await page.target().createCDPSession();
            await cdpSession.send('Network.enable');

            const setCookieHeaders: string[] = [];

            cdpSession.on('Network.responseReceived', (params) => {
              // Capture Set-Cookie headers
              const headers = params.response.headers;
              const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
              if (setCookie) {
                const arr = Array.isArray(setCookie) ? setCookie : setCookie.split('\n');
                setCookieHeaders.push(...arr);
              }

              // FIX: Capture third-party domains from ALL network requests
              // Old code only checked <script src> — missed pixels, fetch, XHR, iframes
              try {
                const reqUrl = new URL(params.response.url);
                if (reqUrl.hostname !== baseHostname && !reqUrl.hostname.endsWith(`.${baseHostname}`)) {
                  // Filter out noise: only meaningful third-party domains
                  const isNoiseDomain = /\.(woff2?|ttf|eot|css)($|\?)/.test(params.response.url);
                  if (!isNoiseDomain) {
                    // Fix: Use getBaseDomain to correctly identify third-party root domains
                    const rootDomain = getBaseDomain(reqUrl.hostname);
                    thirdPartyDomainsSet.add(rootDomain);
                  }
                }
              } catch {}
            });

            // Block visuals for speed (keep XHR/fetch for cookie detection)
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              if (['image', 'font', 'media', 'stylesheet', 'websocket'].includes(req.resourceType())) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Proteccio-Scanner/2.1');

            this.logger.log(`[Crawl ${visited.size}] ${currentUrl}`);
            const response = await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Handle Redirects: update base domain if we redirected on the first page
            if (visited.size === 1) {
              const finalUrl = new URL(page.url());
              const finalDomain = getBaseDomain(finalUrl.hostname);
              if (finalDomain !== baseDomain) {
                this.logger.log(`Redirect detected: updating base domain to ${finalDomain}`);
                baseDomain = finalDomain;
                baseHostname = finalUrl.hostname;
              }
            }

            // ── Page Classification (Content-based) ────────────────────────
            // Do this BEFORE compliance checks so we know what page type we're on
            const urlTypes = classifyPageByUrl(currentUrl);
            const contentTypes = await classifyPageByContent(page, currentUrl);
            // Merge: URL types + content types (content wins for CMS pages)
            const allTypes = [...new Set([...urlTypes, ...contentTypes])];

            classifiedPages.push({ url: currentUrl, types: allTypes, title: '' });

            // Update top-level signals based on page type
            if (allTypes.includes('PRIVACY_POLICY')) {
              complianceSignals.hasPrivacyPolicy = true;
              complianceSignals.privacyPolicyEvidence = { url: currentUrl, snippet: 'Privacy Policy page detected.' };
            }
            if (allTypes.includes('COOKIE_POLICY')) complianceSignals.hasCookieNotice = true;
            if (allTypes.includes('COMPLIANCE')) complianceSignals.hasComplianceNotice = true;

            // ── Smart Wait for Page Load ───────────────────────────────────
            // Wait for network to settle SO THAT async CMP scripts are injected
            const isKeyPage = visited.size <= 3 || allTypes.some(t => t !== 'GENERAL');
            try {
              await Promise.race([
                page.waitForNetworkIdle({ idleTime: 500, timeout: isKeyPage ? 5000 : 2000 }),
                new Promise(r => setTimeout(r, isKeyPage ? 5000 : 2000)),
              ]);
            } catch {}

            // ── Scroll + CMP Interaction ───────────────────────────────────
            await page.evaluate(() => window.scrollBy(0, 500));

            // ── CMP Detection (timing-aware) ──────────────────────────────
            // PROBLEM: domcontentloaded ke baad banner DOM mein nahi hota
            // CMP scripts (OneTrust, Cookiebot etc) asynchronously inject karte hain banner
            // SOLUTION: networkidle ke BAAD check karo, aur agar DOM mein na mile
            //           to <script src> attributes se fingerprint karo (scripts synchronously load hote hain)

            if (!complianceSignals.hasCmpBanner) {
              try {
                // Method 1: Script src fingerprinting — ALWAYS reliable
                // CMP scripts page ke <head> mein hote hain, DOM ready hone se pehle load ho jaate hain
                // Ye method timing se independent hai
                const scriptSrcs = await page.$$eval(
                  'script[src]',
                  (els) => els.map(e => (e as HTMLScriptElement).src.toLowerCase())
                );

                const CMP_SCRIPT_PATTERNS: { pattern: RegExp; name: string }[] = [
                  { pattern: /cookiebot\.com\/uc\.js|cookiebot\.com\/botmanifest/,  name: 'Cookiebot' },
                  { pattern: /cdn\.cookielaw\.org|onetrust\.com/,                   name: 'OneTrust' },
                  { pattern: /app\.cookiefirst\.com/,                               name: 'CookieFirst' },
                  { pattern: /cookieyescdn\.com|cookieyes\.com/,                    name: 'CookieYes' },
                  { pattern: /osano\.com\/dsr\.js/,                                 name: 'Osano' },
                  { pattern: /iubenda\.com\/cs\/consent/,                           name: 'Iubenda' },
                  { pattern: /cookie-script\.com/,                                  name: 'Cookie-Script' },
                  { pattern: /app\.termly\.io/,                                     name: 'Termly' },
                  { pattern: /app\.usercentrics\.eu/,                               name: 'Usercentrics' },
                  { pattern: /cookiehub\.com/,                                      name: 'CookieHub' },
                  { pattern: /privacy-mgmt\.com|sourcepoint\.com/,                  name: 'Sourcepoint' },
                  { pattern: /quantcast\.mgr\.consensu\.org/,                       name: 'Quantcast Choice' },
                ];

                for (const { pattern, name: cmpName } of CMP_SCRIPT_PATTERNS) {
                  if (scriptSrcs.some(src => pattern.test(src))) {
                    complianceSignals.hasCmpBanner = true;
                    complianceSignals.cmpProvider = cmpName;
                    complianceSignals.bannerEvidence = { url: currentUrl, snippet: `CMP detected via script: ${cmpName}` };
                    this.logger.log(`CMP detected via script: ${cmpName} on ${currentUrl}`);
                    break;
                  }
                }

                // Method 2: DOM element check — sirf HOME page pe karo with proper wait
                // General pages pe mat karo (slow aur unreliable)
                if (!complianceSignals.hasCmpBanner && allTypes.includes('HOME')) {
                  // HOME page pe thoda extra wait — banner inject hone ka time do
                  await new Promise(r => setTimeout(r, 1500));

                  const CMP_DOM_SELECTORS = [
                    '#CybotCookiebotDialog',
                    '#onetrust-banner-sdk',
                    '.cky-consent-container',
                    '.osano-cm-window',
                    '[data-cookiefirst-action]',
                    '#cookie-law-info-bar',
                    '.cc-window',
                    '#CookieConsent',
                    '[id*="cookieconsent" i]',
                    '[class*="cookie-consent" i]',
                    '[class*="cookiebanner" i]',
                    '[id*="gdpr-cookie" i]',
                    '[id*="cookie-banner" i]',
                    '[class*="cookie-banner" i]',
                    '[class*="cookie-policy-banner" i]',
                    '[role="dialog"][aria-label*="cookie" i]',
                    '[role="alertdialog"][aria-label*="cookie" i]',
                    '#sp-consent-notice', // Sourcepoint
                    '#qc-cmp2-container', // Quantcast
                    // IAB TCF framework — agar koi bhi CMP IAB compliant hai to ye hoga
                    '#__tppd',
                  ];

                  for (const sel of CMP_DOM_SELECTORS) {
                    try {
                      // Visible hai ya nahi check karo — handles Shadow DOM
                      const isVisible = await page.evaluate((s) => {
                        const deepQuerySelector = (selector: string, root: Document | ShadowRoot = document): HTMLElement | null => {
                          const el = root.querySelector(selector) as HTMLElement;
                          if (el) return el;
                          const allNodes = Array.from(root.querySelectorAll('*'));
                          for (const node of allNodes) {
                            if (node.shadowRoot) {
                              const found = deepQuerySelector(selector, node.shadowRoot);
                              if (found) return found;
                            }
                          }
                          return null;
                        };

                        const el = deepQuerySelector(s);
                        if (!el) return false;
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetHeight > 0;
                      }, sel);

                      if (isVisible) {
                        complianceSignals.hasCmpBanner = true;
                        complianceSignals.cmpProvider = complianceSignals.cmpProvider || 'Unknown CMP';
                        complianceSignals.bannerEvidence = { url: currentUrl, snippet: `CMP detected via deep DOM element: ${sel}` };
                        this.logger.log(`CMP detected via deep DOM: ${sel} on ${currentUrl}`);
                        break;
                      }
                    } catch {}
                  }
                }

                // Method 3: Proteccio ka apna banner check (window variable ya custom element)
                // Agar Proteccio banner inject karta hai koi global variable, use karo
                if (!complianceSignals.hasCmpBanner) {
                  const hasProteccioBannerOnPage = await page.evaluate(() => {
                    // Proteccio banner ka custom element ya window flag — apne hisab se adjust karo
                    return !!(
                      document.querySelector('[data-proteccio-banner]') ||
                      document.querySelector('#proteccio-consent') ||
                      (window as any).__proteccioCMP
                    );
                  }).catch(() => false);

                  if (hasProteccioBannerOnPage) {
                    complianceSignals.hasCmpBanner = true;
                    complianceSignals.cmpProvider = 'Proteccio';
                    complianceSignals.bannerEvidence = { url: currentUrl, snippet: 'Proteccio consent banner detected on page.' };
                  }
                }

              } catch (e) {
                this.logger.warn(`CMP detection error on ${currentUrl}: ${e.message}`);
              }
            }

            // Click accept to trigger post-consent cookies
            for (const sel of CMP_ACCEPT_SELECTORS) {
              try {
                const clicked = await page.evaluate((s) => {
                  let btn: HTMLElement | null = null;
                  
                  // Helper to pierce shadow DOMs (many CMPs like Usercentrics use Shadow DOM)
                  const deepQuerySelectorAll = (selector: string, root: Document | ShadowRoot = document): HTMLElement[] => {
                    const elements = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
                    const allNodes = Array.from(root.querySelectorAll('*'));
                    for (const node of allNodes) {
                      if (node.shadowRoot) {
                        elements.push(...deepQuerySelectorAll(selector, node.shadowRoot));
                      }
                    }
                    return elements;
                  };
                  
                  // Handle custom :has-text selector fallback
                  if (s.includes(':has-text')) {
                    const textToFind = s.match(/:has-text\("(.*?)"\)/)?.[1]?.toLowerCase();
                    if (textToFind) {
                      const elements = deepQuerySelectorAll('button, a, div[role="button"]');
                      btn = elements.find(b => b.textContent?.toLowerCase().includes(textToFind)) || null;
                    }
                  } else {
                    const matches = deepQuerySelectorAll(s);
                    if (matches.length > 0) btn = matches[0];
                  }
                  
                  if (btn && btn.offsetHeight > 0) { 
                    btn.click(); 
                    return true; 
                  }
                  return false;
                }, sel);
                
                if (clicked) {
                  // If we successfully clicked an "Accept" button but haven't marked the banner as found yet, mark it now!
                  if (!complianceSignals.hasCmpBanner) {
                    complianceSignals.hasCmpBanner = true;
                    complianceSignals.cmpProvider = complianceSignals.cmpProvider || 'Custom/Generic CMP';
                    complianceSignals.bannerEvidence = { url: currentUrl, snippet: 'Consent banner detected and accepted via generic clicker.' };
                    this.logger.log(`CMP detected via fallback clicker on ${currentUrl}`);
                  }
                  
                  // Wait 3 seconds to let third-party scripts load and inject tracking cookies after consent
                  await new Promise(r => setTimeout(r, 3000));
                  break;
                }
              } catch {}
            }

            const lang = await page.evaluate(() => document.documentElement.lang).catch(() => '');
            if (lang && lang.toLowerCase() !== 'en') {
              complianceSignals.hasLocalization = true;
              complianceSignals.languageEvidence = { url: currentUrl, snippet: `Page language detected as: ${lang}` };
            }

            // ── CONDITIONAL COMPLIANCE SCANNING ───────────────────────────
            // Only scan for signals on pages that are relevant to that indicator.
            // This mirrors how OneTrust/Cookiebot actually score compliance.
            const shouldScanForPolicySignals =
              allTypes.includes('PRIVACY_POLICY') ||
              allTypes.includes('COOKIE_POLICY') ||
              allTypes.includes('COMPLIANCE');

            if (shouldScanForPolicySignals) {
              const pageText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
              const lowerText = pageText.toLowerCase();

              const extractSnippet = (text: string, keyword: string): string => {
                const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
                if (idx === -1) return '';
                return '...' + text.substring(Math.max(0, idx - 40), Math.min(text.length, idx + 120)).replace(/\n/g, ' ').trim() + '...';
              };

              // DSAR → PRIVACY_POLICY or COOKIE_POLICY
              if ((allTypes.includes('PRIVACY_POLICY') || allTypes.includes('COOKIE_POLICY')) && !complianceSignals.hasDsar) {
                if (lowerText.includes('dsar') || lowerText.includes('data subject') || lowerText.includes('your rights') || lowerText.includes('right to access')) {
                  complianceSignals.hasDsar = true;
                  complianceSignals.dsarEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'dsar') || extractSnippet(pageText, 'data subject') || extractSnippet(pageText, 'your rights'),
                  };
                }
              }

              // Opt-out → PRIVACY_POLICY or COOKIE_POLICY
              if ((allTypes.includes('PRIVACY_POLICY') || allTypes.includes('COOKIE_POLICY')) && !complianceSignals.hasOptOut) {
                if (lowerText.includes('opt-out') || lowerText.includes('opt out') || lowerText.includes('withdraw consent') || lowerText.includes('unsubscribe')) {
                  complianceSignals.hasOptOut = true;
                  complianceSignals.optOutEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'opt-out') || extractSnippet(pageText, 'withdraw'),
                  };
                }
              }

              // Third-party disclosure → COOKIE_POLICY, PRIVACY_POLICY
              if ((allTypes.includes('PRIVACY_POLICY') || allTypes.includes('COOKIE_POLICY')) && !complianceSignals.hasThirdPartyDisclosure) {
                if (lowerText.includes('third party') || lowerText.includes('third-party') || lowerText.includes('share your data') || lowerText.includes('share personal')) {
                  complianceSignals.hasThirdPartyDisclosure = true;
                  complianceSignals.thirdPartyEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'third party') || extractSnippet(pageText, 'share your data'),
                  };
                }
              }

              // Cookie categorization → COOKIE_POLICY only
              if (allTypes.includes('COOKIE_POLICY') && !complianceSignals.hasCategorization) {
                const hasCategories =
                  (lowerText.includes('necessary') || lowerText.includes('essential')) &&
                  (lowerText.includes('analytics') || lowerText.includes('performance')) &&
                  (lowerText.includes('marketing') || lowerText.includes('advertising'));
                if (hasCategories) {
                  complianceSignals.hasCategorization = true;
                  complianceSignals.categorizationEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'necessary') || extractSnippet(pageText, 'analytics'),
                  };
                }
              }

              // Consent logging mention → COOKIE_POLICY or PRIVACY_POLICY
              if ((allTypes.includes('COOKIE_POLICY') || allTypes.includes('PRIVACY_POLICY')) && !complianceSignals.hasConsentLogging) {
                if (lowerText.includes('consent log') || lowerText.includes('record your consent') || lowerText.includes('consent management')) {
                  complianceSignals.hasConsentLogging = true;
                  complianceSignals.consentLoggingEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'consent log') || extractSnippet(pageText, 'record your consent'),
                  };
                }
              }

              // Grievance → PRIVACY_POLICY or COMPLIANCE
              if ((allTypes.includes('PRIVACY_POLICY') || allTypes.includes('COMPLIANCE')) && !complianceSignals.hasGrievance) {
                if (lowerText.includes('grievance') || lowerText.includes('nodal officer') || lowerText.includes('complaint officer') || lowerText.includes('grievance redressal')) {
                  complianceSignals.hasGrievance = true;
                  complianceSignals.grievanceEvidence = {
                    url: currentUrl,
                    snippet: extractSnippet(pageText, 'grievance') || extractSnippet(pageText, 'nodal officer'),
                  };
                }
              }
            }

            // ── Cookie Collection ──────────────────────────────────────────
            // HTTP Cookies
            const cookies = await page.cookies();
            for (const cookie of cookies) {
              if (!discoveredCookies.has(cookie.name)) {
                discoveredCookies.set(cookie.name, { ...cookie, foundOn: currentUrl, type: 'HTTP_COOKIE' });
              }
            }

            // Set-Cookie headers from CDP
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

            // LocalStorage & SessionStorage
            const storageData = await page.evaluate(() => {
              const ls: Record<string, string> = {};
              const ss: Record<string, string> = {};
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k) ls[k] = 'hidden';
                }
                for (let i = 0; i < sessionStorage.length; i++) {
                  const k = sessionStorage.key(i);
                  if (k) ss[k] = 'hidden';
                }
              } catch {}
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

            // ── Smart Scroll to bottom (triggers lazy-loaded links/footers) ──
            await page.evaluate(async () => {
              await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                  const scrollHeight = document.body.scrollHeight;
                  window.scrollBy(0, distance);
                  totalHeight += distance;
                  if (totalHeight >= scrollHeight || totalHeight > 10000) {
                    clearInterval(timer);
                    resolve();
                  }
                }, 100);
              });
            }).catch(() => {});

            // ── Deep Link Extraction (Shadow DOM piercing) ──────────────────
            const links = await page.evaluate(() => {
              const allLinks: string[] = [];
              const extractFrom = (root: Document | ShadowRoot) => {
                try {
                  const anchors = Array.from(root.querySelectorAll('a')) as HTMLAnchorElement[];
                  anchors.forEach(a => { 
                    try {
                      // Get absolute href
                      const href = a.href;
                      if (href && href.startsWith('http')) {
                        allLinks.push(href);
                      }
                    } catch {}
                  });
                  
                  // Also look for links in buttons/divs with data-href or similar (common in SPAs)
                  const clickable = Array.from(root.querySelectorAll('[data-href], [onclick*="location.href"]'));
                  clickable.forEach(el => {
                    const href = el.getAttribute('data-href');
                    if (href && href.startsWith('http')) allLinks.push(href);
                  });

                  const children = Array.from(root.querySelectorAll('*'));
                  children.forEach(child => {
                    if (child.shadowRoot) extractFrom(child.shadowRoot);
                  });
                } catch {}
              };
              extractFrom(document);
              return [...new Set(allLinks)];
            }).catch(() => [] as string[]);

            this.logger.log(`Found ${links.length} potential links on ${currentUrl}`);

            const baseUrl = new URL(website.url);
            let enqueuedThisPage = 0;
            for (const link of links) {
              try {
                const normalizedLink = normalizeUrl(link);
                const linkUrl = new URL(normalizedLink);
                const linkDomain = getBaseDomain(linkUrl.hostname);
                
                const isInternal = linkDomain === baseDomain;
                const isPolicyLink = /privacy|cookie|legal|terms|gdpr|compliance|grievance/.test(normalizedLink);
                
                // Allow internal links OR external policy links (to find policies on other domains)
                if ((isInternal || isPolicyLink) && !visited.has(normalizedLink) && !enqueued.has(normalizedLink)) {
                  // Limit external policy links to avoid crawling the whole internet
                  if (!isInternal && enqueued.size > 50) continue; 
                  
                  if (isPolicyLink) {
                    queue.unshift(normalizedLink);
                  } else {
                    queue.push(normalizedLink);
                  }
                  enqueued.add(normalizedLink);
                  enqueuedThisPage++;
                }
              } catch {}
            }
            if (enqueuedThisPage > 0) {
              this.logger.log(`Enqueued ${enqueuedThisPage} new links from ${currentUrl}`);
            }

          } catch (err) {
            this.logger.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
          } finally {
            await page.close();
          }
        }));
      }

      if (context) await context.close();

      // ── Final website existence check ──────────────────────────────────
      const finalCheck = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        select: { id: true },
      });
      if (!finalCheck) {
        this.logger.warn(`Website ${websiteId} deleted during scan. Aborting.`);
        return { status: 'ABORTED', reason: 'Website deleted' };
      }

      // ── Process Cookies ────────────────────────────────────────────────
      const results: any[] = [];
      const categoryCounts: Record<string, number> = {
        NECESSARY: 0, FUNCTIONAL: 0, ANALYTICS: 0, MARKETING: 0, UNCATEGORIZED: 0,
      };

      for (const [name, cookie] of discoveredCookies.entries()) {
        let info = { category: 'UNCATEGORIZED' as any, description: 'Unknown cookie discovered during scan.' };

        if (website.autoCategorize) {
          try {
            const hostname = new URL(website.url).hostname;
            let classification;

            if (cookie.type === 'LOCAL_STORAGE') {
              classification = this.cookieClassifier.classifyStorageKey(name.replace('[LS] ', ''), 'localStorage');
            } else if (cookie.type === 'SESSION_STORAGE') {
              classification = this.cookieClassifier.classifyStorageKey(name.replace('[SS] ', ''), 'sessionStorage');
            } else {
              classification = this.cookieClassifier.classify(name, hostname);
            }
            info = { category: classification.category as any, description: classification.description };
          } catch {
            info = this.cookieClassifier.classify(name);
          }
        }

        categoryCounts[info.category] = (categoryCounts[info.category] || 0) + 1;

        let category = await this.prisma.cookieCategory.findFirst({
          where: { category: info.category, tenantId: website.tenantId },
        });
        if (!category) {
          category = await this.prisma.cookieCategory.create({
            data: { name: info.category, category: info.category, tenantId: website.tenantId },
          });
        }

        const existing = await this.prisma.cookieInventory.findFirst({
          where: { name: name.trim(), domain: website.url, tenantId: website.tenantId },
        });

        if (existing) {
          await this.prisma.cookieInventory.update({
            where: { id: existing.id },
            data: { categoryId: category.id, description: info.description, websiteId },
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
              websiteId,
            },
          });
          results.push(inventory);
        }
      }

      // ── Finalize ───────────────────────────────────────────────────────
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: {
          status: ScanStatus.COMPLETED,
          lastScan: new Date(),
          pagesCrawled: visited.size,
          cookiesDetected: discoveredCookies.size,
        },
      });

      await this.complianceScanner.evaluateCompliance(
        websiteId,
        discoveredCookies.size,
        Array.from(visited),
        Array.from(thirdPartyDomainsSet),   // Now network-captured, not DOM-scraped
        complianceSignals,
        Array.from(discoveredCookies.values()),
      );

      const updatedWebsite = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });

      // ── Notification Email ─────────────────────────────────────────────
      if (website.email) {
        const isPeriodic = !!website.lastScan;
        const indicators = (updatedWebsite?.scanResults as any[]) || [];

        const getStatus = (id: string) => {
          const ind = indicators.find(i => i.id === id);
          if (!ind) return { icon: '✖', text: 'Missing' };
          return ind.passed ? { icon: '✔', text: 'Present' } : { icon: '✖', text: 'Missing' };
        };

        const keyRisks = indicators.filter(i => !i.passed).map(i => `${i.name} issue detected.`).slice(0, 5);
        const recommendedActions = indicators.filter(i => !i.passed).map(i => `Implement or fix ${i.name}`).slice(0, 5);
        const changesDetected: string[] = [];

        if (website.lastScan && updatedWebsite?.complianceScore !== website.complianceScore) {
          changesDetected.push(`Score changed from ${website.complianceScore || 0}% to ${updatedWebsite?.complianceScore}%`);
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
            thirdPartyDomains: Array.from(thirdPartyDomainsSet),
            cmpProvider: complianceSignals.cmpProvider,
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
            changesDetected,
          }
        );
      }

      this.logger.log(`Scan complete: ${website.url} | Pages: ${visited.size} | Cookies: ${discoveredCookies.size} | 3P Domains: ${thirdPartyDomainsSet.size}`);
      return { cookiesFound: discoveredCookies.size, pagesScanned: visited.size };

    } catch (error) {
      this.logger.error(`Scan failed for ${websiteId}: ${error.message}`);
      try {
        await this.prisma.scannedWebsite.update({
          where: { id: websiteId },
          data: { status: ScanStatus.FAILED },
        });
      } catch (dbErr) {
        this.logger.warn(`Could not update FAILED status: ${dbErr.message}`);
      }
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}