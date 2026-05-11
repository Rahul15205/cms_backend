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

const PRIVACY_URL_PATTERN = /(?:^|[/_-])(?:privacy|privacy[-_]?policy|privacy[-_]?notice|privacy[-_]?statement|privacy[-_]?center|data[-_]?protection|datenschutz|privacidad)(?:[/_.-]|$)/i;
const COOKIE_URL_PATTERN = /(?:^|[/_-])(?:cookies?|cookie[-_]?policy|cookies[-_]?policy|cookie[-_]?notice|cookie[-_]?declaration|cookie[-_]?statement)(?:[/_.-]|$)/i;
const COMPLIANCE_URL_PATTERN = /(?:compliance|legal|grievance|terms[-_]?of[-_]?(use|service)|terms|gdpr|ccpa|dpdp|dpo|nodal[-_]?officer)/i;
const POLICY_LINK_PATTERN = /privacy|cookie|legal|terms|gdpr|ccpa|dpdp|compliance|grievance|dpo|nodal/i;

const COMMON_POLICY_PATHS = [
  '/privacy',
  '/privacy-policy',
  '/privacy-notice',
  '/privacy-statement',
  '/privacy-center',
  '/legal/privacy',
  '/legal/privacy-policy',
  '/data-protection',
  '/cookie-policy',
  '/cookies',
  '/cookies-policy',
  '/cookie-notice',
  '/cookie-declaration',
  '/legal/cookie-policy',
  '/terms',
  '/terms-of-use',
  '/terms-of-service',
  '/legal',
  '/compliance',
  '/gdpr',
  '/ccpa',
  '/grievance',
  '/grievance-redressal',
];

const COMMON_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemap1.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
];

const CMP_SCRIPT_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /cookiebot\.com\/uc\.js|cookiebot\.com\/botmanifest/i, name: 'Cookiebot' },
  { pattern: /cdn\.cookielaw\.org|onetrust\.com/i, name: 'OneTrust' },
  { pattern: /app\.cookiefirst\.com/i, name: 'CookieFirst' },
  { pattern: /cookieyescdn\.com|cookieyes\.com/i, name: 'CookieYes' },
  { pattern: /osano\.com/i, name: 'Osano' },
  { pattern: /iubenda\.com/i, name: 'Iubenda' },
  { pattern: /cookie-script\.com/i, name: 'Cookie-Script' },
  { pattern: /termly\.io/i, name: 'Termly' },
  { pattern: /usercentrics\.eu|usercentrics\.com/i, name: 'Usercentrics' },
  { pattern: /cookiehub\.com/i, name: 'CookieHub' },
  { pattern: /privacy-mgmt\.com|sourcepoint\.com/i, name: 'Sourcepoint' },
  { pattern: /quantcast\.mgr\.consensu\.org|quantcast\.com\/choice/i, name: 'Quantcast Choice' },
  { pattern: /consentmanager\.(net|com)/i, name: 'Consentmanager' },
  { pattern: /didomi\.io/i, name: 'Didomi' },
  { pattern: /trustarc\.com|truste\.com/i, name: 'TrustArc' },
];

const MAX_SCAN_DEBUG_ENTRIES = 2000;

interface CrawlDebugEntry {
  url: string;
  source?: string;
  finalUrl?: string;
  status?: number | string;
  contentType?: string;
  reason?: string;
  pageTypes?: string[];
  title?: string;
}

function normalizeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    parsed.hash = '';
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid'];
    for (const param of paramsToRemove) parsed.searchParams.delete(param);
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.href;
  } catch {
    return urlStr;
  }
}

// ─── Page Type Classification ──────────────────────────────────────────────
// Industry approach: classify pages by URL + content signals
// This drives conditional compliance scanning (OneTrust does exactly this)

function getBaseDomain(hostname: string): string {
  const cleanHostname = hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./i, '');
  if (!cleanHostname) return '';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanHostname)) return cleanHostname;

  const parts = cleanHostname.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');

  const tld2 = parts.slice(-2).join('.');
  if (['co.in', 'com.au', 'co.uk', 'org.in', 'net.in', 'co.nz', 'co.jp'].includes(tld2)) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

function isMeaningfulThirdPartyDomain(domain: string): boolean {
  if (!domain) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return true;
  if (!domain.includes('.') || domain.endsWith('.')) return false;
  if (/^[a-z0-9]{25,}$/i.test(domain)) return false;
  return true;
}

function decodeXmlValue(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractSitemapLocs(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(decodeXmlValue(match[1].trim()));
  }

  return urls;
}

async function fetchScannerText(url: string, timeoutMs = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 Proteccio-Scanner/2.1',
        Accept: 'text/html,application/xml,text/xml,text/plain,*/*;q=0.8',
      },
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverSitemapUrls(startUrl: string, baseDomain: string, maxUrls: number): Promise<string[]> {
  const start = new URL(startUrl);
  const sitemapQueue = new Set<string>(COMMON_SITEMAP_PATHS.map(path => `${start.origin}${path}`));
  const robotsText = await fetchScannerText(`${start.origin}/robots.txt`, 5000);

  if (robotsText) {
    const sitemapRegex = /^sitemap:\s*(\S+)/gim;
    let match: RegExpExecArray | null;
    while ((match = sitemapRegex.exec(robotsText)) !== null) {
      sitemapQueue.add(match[1].trim());
    }
  }

  const discovered = new Set<string>();
  const seenSitemaps = new Set<string>();
  const pending = Array.from(sitemapQueue);

  while (pending.length > 0 && discovered.size < maxUrls) {
    const sitemapUrl = pending.shift()!;
    const normalizedSitemapUrl = normalizeUrl(sitemapUrl);
    if (seenSitemaps.has(normalizedSitemapUrl)) continue;
    seenSitemaps.add(normalizedSitemapUrl);

    const xml = await fetchScannerText(sitemapUrl);
    if (!xml) continue;

    for (const loc of extractSitemapLocs(xml)) {
      try {
        const parsed = new URL(loc);
        if (!['http:', 'https:'].includes(parsed.protocol)) continue;
        if (getBaseDomain(parsed.hostname) !== baseDomain) continue;

        const normalizedLoc = normalizeUrl(parsed.href);
        if (/\.xml(?:$|\?)/i.test(parsed.pathname) || /sitemap/i.test(parsed.pathname)) {
          if (!seenSitemaps.has(normalizedLoc)) pending.push(parsed.href);
        } else {
          discovered.add(normalizedLoc);
          if (discovered.size >= maxUrls) break;
        }
      } catch {}
    }
  }

  return Array.from(discovered);
}

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
  const parsed = new URL(url);
  const lower = `${parsed.pathname}${parsed.search}`.toLowerCase();

  if (/^\/?$|\/home(?:[/_.-]|$)|\/index(?:[/_.-]|$)/.test(lower)) types.push('HOME');
  if (PRIVACY_URL_PATTERN.test(lower)) types.push('PRIVACY_POLICY');
  if (COOKIE_URL_PATTERN.test(lower)) types.push('COOKIE_POLICY');
  if (COMPLIANCE_URL_PATTERN.test(lower)) types.push('COMPLIANCE');

  return types.length ? types : ['GENERAL'];
}

/**
 * Classify page type from rendered content.
 * Handles CMS pages where URL slug doesn't reveal page type.
 * Check h1, title, and first 500 chars of body text.
 */
async function classifyPageByContent(page: puppeteer.Page, url: string): Promise<{ types: PageType[]; title: string; mainText: string }> {
  try {
    const data = await page.evaluate(() => {
      const title = document.title || '';
      const h1 = document.querySelector('h1')?.textContent || '';
      
      // Clone body and remove boilerplate to find "real" content
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      const boilerplateSelectors = ['header', 'footer', 'nav', '.nav', '.footer', '.header', '#header', '#footer', '.menu', '.sidebar'];
      boilerplateSelectors.forEach(sel => {
        bodyClone.querySelectorAll(sel).forEach(el => el.remove());
      });

      const mainText = bodyClone.innerText?.trim() || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      return { 
        title: title.trim(), 
        h1: h1.trim(), 
        mainText: mainText.substring(0, 15000), 
        metaDescription: metaDescription.trim() 
      };
    });

    const titleLower = data.title.toLowerCase();
    const headingText = `${titleLower} ${data.h1.toLowerCase()} ${data.metaDescription.toLowerCase()}`;
    const mainLower = data.mainText.toLowerCase();
    
    const types: PageType[] = [];

    // Privacy Policy Detection
    const privacyHeading = /privacy policy|privacy notice|privacy statement|data protection notice|privacy center|privacy information/.test(headingText);
    const privacyContent = 
      /privacy policy|privacy notice|privacy statement|personal data we collect|your privacy rights/.test(mainLower) &&
      /personal data|personal information|data subject|controller|processor|collect|process|rights/.test(mainLower);
    
    if (privacyHeading || privacyContent) {
      types.push('PRIVACY_POLICY');
    }

    // Cookie Policy Detection
    const cookieHeading = /cookie policy|cookie notice|cookie declaration|cookie statement/.test(headingText);
    const cookieContent =
      /how we use cookies|types of cookies|manage cookies|cookie preferences|strictly necessary cookies/.test(mainLower) &&
      /necessary|essential|analytics|performance|marketing|advertising|functional/.test(mainLower);
    
    if (cookieHeading || cookieContent) {
      types.push('COOKIE_POLICY');
    }

    if (/grievance|nodal officer|complaint officer|compliance officer|legal notice|terms of (use|service)|data protection officer|dpo/.test(headingText + ' ' + mainLower)) {
      types.push('COMPLIANCE');
    }

    return { 
      types: types.length ? types : ['GENERAL'], 
      title: data.title,
      mainText: data.mainText
    };
  } catch {
    return { types: ['GENERAL'], title: '', mainText: '' };
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
  privacyPolicyConfidence?: number;
  cookiePolicyEvidence?: { url: string; snippet: string };
  cookiePolicyConfidence?: number;
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
  ':has-text("Accept")',
  ':has-text("Accept Cookies")',
  ':has-text("I Agree")',
  ':has-text("Allow All")',
  ':has-text("Agree")',
  ':has-text("Got it")',
  ':has-text("OK")',
  ':has-text("Continue")',
  ':has-text("Akzeptieren")',
  ':has-text("Aceptar")',
  ':has-text("Tout accepter")'
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
    const crawledPageUrls = new Set<string>();
    const guessedPolicyUrls = new Set<string>();
    const urlSources = new Map<string, string>();
    const crawlDebugCrawled: CrawlDebugEntry[] = [];
    const crawlDebugSkipped: CrawlDebugEntry[] = [];
    const crawlDebugTotals = {
      queued: 1,
      attempted: 0,
      crawled: 0,
      skipped: 0,
    };
    const normalizedStart = normalizeUrl(website.url);
    const queue: string[] = [normalizedStart];
    enqueued.add(normalizedStart);
    urlSources.set(normalizedStart, 'start-url');

    // Track page classifications for conditional compliance scanning
    const classifiedPages: PageClassification[] = [];

    const maxPages = website.depth === ScanDepth.DEEP ? Infinity : 100;
    const maxAttempts = website.depth === ScanDepth.DEEP ? Infinity : maxPages * 3;
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

      const baseUrl = new URL(website.url);
      let baseDomain = getBaseDomain(baseUrl.hostname);

      const recordSkippedUrl = (entry: CrawlDebugEntry) => {
        crawlDebugTotals.skipped++;
        if (crawlDebugSkipped.length < MAX_SCAN_DEBUG_ENTRIES) {
          crawlDebugSkipped.push(entry);
        }
      };

      const recordCrawledUrl = (entry: CrawlDebugEntry) => {
        crawlDebugTotals.crawled++;
        if (crawlDebugCrawled.length < MAX_SCAN_DEBUG_ENTRIES) {
          crawlDebugCrawled.push(entry);
        }
      };

      const enqueueDiscoveredUrl = (url: string, priority = false, source = 'page-link'): boolean => {
        try {
          if (!url) {
            recordSkippedUrl({ url: String(url || ''), source, reason: 'empty-url' });
            return false;
          }
          if (!url.startsWith('http')) {
            recordSkippedUrl({ url, source, reason: 'non-http-url' });
            return false;
          }
          const normalizedLink = normalizeUrl(url);
          const linkUrl = new URL(normalizedLink);
          if (!['http:', 'https:'].includes(linkUrl.protocol)) {
            recordSkippedUrl({ url: normalizedLink, source, reason: `unsupported-protocol:${linkUrl.protocol}` });
            return false;
          }

          const linkDomain = getBaseDomain(linkUrl.hostname);
          const isInternal = linkDomain === baseDomain;
          const isPolicyLink = POLICY_LINK_PATTERN.test(normalizedLink);

          // Allow if it's the same base domain OR if it's a policy-related link (e.g. parent company policy)
          if ((!isInternal && !isPolicyLink) || visited.has(normalizedLink) || enqueued.has(normalizedLink)) {
            if (!isInternal && !isPolicyLink) {
              recordSkippedUrl({
                url: normalizedLink,
                source,
                reason: `external-domain-restricted`,
              });
            }
            return false;
          }

          if (priority && queue.length > 0) {
            queue.splice(1, 0, normalizedLink);
          } else {
            queue.push(normalizedLink);
          }
          enqueued.add(normalizedLink);
          urlSources.set(normalizedLink, source);
          crawlDebugTotals.queued++;
          return true;
        } catch {
          recordSkippedUrl({ url, source, reason: 'invalid-url' });
          return false;
        }
      };

      for (const path of COMMON_POLICY_PATHS) {
        const guessedUrl = new URL(path, baseUrl.origin).href;
        if (enqueueDiscoveredUrl(guessedUrl, true, 'common-policy-path')) {
          guessedPolicyUrls.add(normalizeUrl(guessedUrl));
        }
      }

      try {
        const sitemapLimit = website.depth === ScanDepth.DEEP ? 5000 : 100;
        const sitemapUrls = await discoverSitemapUrls(website.url, baseDomain, sitemapLimit);
        let sitemapAdded = 0;
        for (const url of sitemapUrls) {
          if (enqueueDiscoveredUrl(url, POLICY_LINK_PATTERN.test(url), 'sitemap')) sitemapAdded++;
        }
        if (sitemapAdded > 0) {
          this.logger.log(`Seeded ${sitemapAdded} URL(s) from sitemap/robots for ${website.url}`);
        }
      } catch (e) {
        this.logger.warn(`Sitemap discovery failed for ${website.url}: ${e.message}`);
      }

      // ── Main Crawl Loop ─────────────────────────────────────────────────
      while (queue.length > 0 && crawledPageUrls.size < maxPages && visited.size < maxAttempts) {
        // Check if website still exists (handles deletion during scan)
        // Only check every 5 pages to avoid DB spam
        if (visited.size % 5 === 0) {
          const exists = await this.prisma.scannedWebsite.findUnique({ 
            where: { id: websiteId },
            select: { id: true } 
          });
          if (!exists) {
            this.logger.warn(`Website ${websiteId} deleted during scan. Stopping.`);
            break;
          }
        }

        if (Date.now() - scanStartTime > MAX_SCAN_TIME_MS) {
          this.logger.warn(`Time budget exceeded for ${website.url}. Stopping.`);
          break;
        }

        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);
        crawlDebugTotals.attempted++;
        const currentSource = urlSources.get(currentUrl) || 'queue';

        const page = await context!.newPage();
        try {
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Proteccio-Scanner/2.1');
          this.logger.log(`[Crawl ${visited.size}] ${currentUrl}`);
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
                const responseUrl = params.response.url.toLowerCase();
                if (!complianceSignals.hasCmpBanner) {
                  for (const { pattern, name: cmpName } of CMP_SCRIPT_PATTERNS) {
                    if (pattern.test(responseUrl)) {
                      complianceSignals.hasCmpBanner = true;
                      complianceSignals.cmpProvider = cmpName;
                      complianceSignals.bannerEvidence = { url: currentUrl, snippet: `CMP detected via network request: ${cmpName}` };
                      this.logger.log(`CMP detected via network request: ${cmpName} on ${currentUrl}`);
                      break;
                    }
                  }
                }

                const reqUrl = new URL(params.response.url);
                if (!['http:', 'https:'].includes(reqUrl.protocol) || !reqUrl.hostname) return;
                const reqDomain = getBaseDomain(reqUrl.hostname);
                if (reqDomain !== baseDomain && isMeaningfulThirdPartyDomain(reqDomain)) {
                  // Filter out noise: only meaningful third-party domains
                  const isNoiseDomain = /\.(woff2?|ttf|eot|css)($|\?)/.test(params.response.url);
                  if (!isNoiseDomain) {
                    // Fix: Use getBaseDomain to correctly identify third-party root domains
                    thirdPartyDomainsSet.add(reqDomain);
                  }
                }
              } catch {}
            });

            // Block visuals for speed (keep XHR/fetch for cookie detection)
            await page.setRequestInterception(true);
            page.on('request', (req) => {
              if (['image', 'font', 'media', 'websocket'].includes(req.resourceType())) {
                req.abort();
              } else {
                req.continue();
              }
            });

            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Proteccio-Scanner/2.1');

            this.logger.log(`[Crawl ${visited.size}] ${currentUrl}`);
            const response = await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const statusCode = response?.status();
            const contentType = response?.headers()['content-type'] || '';
            const isHtmlResponse = !contentType || /text\/html|application\/xhtml\+xml/i.test(contentType);
            if ((statusCode && statusCode >= 400) || !isHtmlResponse) {
              this.logger.warn(`Skipping non-page response for ${currentUrl}: status=${statusCode || 'unknown'} type=${contentType || 'unknown'}`);
              recordSkippedUrl({
                url: currentUrl,
                source: currentSource,
                finalUrl: page.url() || currentUrl,
                status: statusCode || 'unknown',
                contentType: contentType || 'unknown',
                reason: statusCode && statusCode >= 400 ? `http-status:${statusCode}` : `non-html:${contentType || 'unknown'}`,
              });
              continue;
            }
            const pageUrl = normalizeUrl(page.url() || currentUrl);
            crawledPageUrls.add(pageUrl);
            enqueued.add(pageUrl);
            
            // Handle Redirects: update base domain if we redirected on the first page
            if (visited.size === 1) {
              const finalUrl = new URL(page.url());
              const finalDomain = getBaseDomain(finalUrl.hostname);
              if (finalDomain !== baseDomain) {
                this.logger.log(`Redirect detected: updating base domain to ${finalDomain}`);
                baseDomain = finalDomain;
              }
            }

            const urlTypes = classifyPageByUrl(pageUrl);

            // ── Smart Wait for Page Load ───────────────────────────────────
            // Wait for network to settle SO THAT async CMP scripts are injected and SPA content renders
            const isKeyPage = visited.size <= 3 || urlTypes.some(t => t !== 'GENERAL');
            try {
              await Promise.race([
                page.waitForNetworkIdle({ idleTime: 500, timeout: isKeyPage ? 5000 : 2000 }),
                new Promise(r => setTimeout(r, isKeyPage ? 5000 : 2000)),
              ]);
            } catch {}

            // ── Page Classification (Content-based) ────────────────────────
            // Do this AFTER network idle so SPA content (like React) is fully rendered
            const { types: contentTypes, title: pageTitle, mainText: pageMainText } = await classifyPageByContent(page, pageUrl);
            
            // Merge: URL types + content types (content wins for CMS pages)
            let allTypes = [...new Set([...urlTypes, ...contentTypes])];
            const contentConfirmedPolicyTypes = contentTypes.filter(t => t === 'PRIVACY_POLICY' || t === 'COOKIE_POLICY' || t === 'COMPLIANCE');
            const isGuessedPolicyCandidate = guessedPolicyUrls.has(currentUrl) || guessedPolicyUrls.has(pageUrl);
            if (isGuessedPolicyCandidate && contentConfirmedPolicyTypes.length === 0) {
              allTypes = contentTypes;
            }
            
            const pageLooksMissing = await page.evaluate(() => {
              const text = `${document.title || ''} ${document.querySelector('h1')?.textContent || ''} ${document.body?.innerText?.substring(0, 1200) || ''}`.toLowerCase();
              return /404|page not found|not found|page does not exist|page unavailable/.test(text);
            }).catch(() => false);
            
            if (pageLooksMissing && contentTypes.every(t => t === 'GENERAL')) {
              allTypes = contentTypes;
            }
 
            classifiedPages.push({ url: pageUrl, types: allTypes, title: pageTitle });
            recordCrawledUrl({
              url: currentUrl,
              source: currentSource,
              finalUrl: pageUrl,
              status: statusCode || 'unknown',
              contentType: contentType || 'unknown',
              pageTypes: allTypes,
              title: pageTitle,
            });
 
            const calculatePrivacyConfidence = (url: string, title: string) => {
              let score = 0;
              const lowUrl = url.toLowerCase();
              const lowTitle = title.toLowerCase();

              // Base Domain Bonus: Strongly prefer policies hosted on the official domain
              try {
                const targetDomain = getBaseDomain(new URL(url).hostname);
                if (targetDomain === baseDomain) {
                  score += 40;
                }
              } catch {}

              // URL signals (Strongest)
              if (lowUrl.includes('privacy-policy') || lowUrl.includes('privacy-notice')) score += 100;
              else if (lowUrl.includes('/privacy')) score += 80; // High score for clean /privacy path
              else if (lowUrl.includes('privacy')) score += 40;
              
              if (lowUrl.includes('/legal')) score += 20; // Legal directory is a good sign
              if (lowUrl.includes('policy') || lowUrl.includes('notice')) score += 20;
              
              // Title signals (Medium)
              if (lowTitle.includes('privacy policy') || lowTitle.includes('privacy notice')) score += 60;
              else if (lowTitle.includes('privacy')) score += 30;
              
              // Penalty for non-policy pages
              if (lowUrl.includes('manage') || lowUrl.includes('communication') || lowUrl.includes('setting') || lowUrl.includes('preference')) score -= 80;
              if (lowUrl.includes('terms') || lowUrl.includes('condition')) score -= 40; // Terms of service pages often mention privacy
              
              return score;
            };

            // Update top-level signals based on page type
            if (allTypes.includes('PRIVACY_POLICY')) {
              complianceSignals.hasPrivacyPolicy = true;
              
              const currentPrivacyConfidence = calculatePrivacyConfidence(pageUrl, pageTitle);
              const prevPrivacyConfidence = complianceSignals.privacyPolicyConfidence || -1000;
              
              // Always prefer the higher confidence page
              if (currentPrivacyConfidence > prevPrivacyConfidence || !complianceSignals.privacyPolicyEvidence) {
                complianceSignals.privacyPolicyEvidence = { 
                  url: pageUrl, 
                  snippet: pageTitle ? `Privacy Policy: ${pageTitle}` : 'Privacy Policy page detected.' 
                };
                complianceSignals.privacyPolicyConfidence = currentPrivacyConfidence;
              }
            }
            if (allTypes.includes('COOKIE_POLICY')) {
              complianceSignals.hasCookieNotice = true;
              if (!complianceSignals.bannerEvidence) {
                 complianceSignals.bannerEvidence = { url: pageUrl, snippet: `Cookie Policy found: ${pageTitle || pageUrl}` };
              }
            }
            if (allTypes.includes('COMPLIANCE')) complianceSignals.hasComplianceNotice = true;

            // ── Scroll + CMP Interaction ───────────────────────────────────
            await page.evaluate(() => window.scrollBy(0, 500));

            // ── CMP Detection (Enhanced & Evidence-Focused) ────────────────
            // Focus: High-reliability detection + text evidence for compliance proof
            
            if (!complianceSignals.hasCmpBanner) {
              try {
                // Method 1: Fingerprinting (Scripts/Global APIs)
                // This gives us the PROVIDER name even if the banner isn't visible yet
                let detectedCmpName = '';
                
                // Check Global APIs
                const apiCmp = await page.evaluate(() => {
                  if ((window as any).Cookiebot) return 'Cookiebot';
                  if ((window as any).OneTrust) return 'OneTrust';
                  if ((window as any).UC_UI) return 'Usercentrics';
                  if ((window as any).CookieYes || (window as any).cky_config) return 'CookieYes';
                  if ((window as any).__tcfapi) return 'IAB TCF Framework';
                  if ((window as any).__cmp) return 'IAB CMP';
                  if ((window as any).Osano) return 'Osano';
                  return null;
                }).catch(() => null);
                
                if (apiCmp) detectedCmpName = apiCmp;

                // Check Scripts if API didn't catch it
                if (!detectedCmpName) {
                  const scripts = await page.$$eval('script[src]', (els) => els.map(e => (e as HTMLScriptElement).src.toLowerCase())).catch(() => []);
                  for (const { pattern, name } of CMP_SCRIPT_PATTERNS) {
                    if (scripts.some(src => pattern.test(src))) {
                      detectedCmpName = name;
                      break;
                    }
                  }
                }

                if (detectedCmpName) {
                  complianceSignals.hasCmpBanner = true;
                  complianceSignals.cmpProvider = detectedCmpName;
                  complianceSignals.bannerEvidence = { url: currentUrl, snippet: `CMP detected via script/API: ${detectedCmpName}` };
                  this.logger.log(`CMP fingerprint detected: ${detectedCmpName} on ${currentUrl}`);
                }

                // Method 2: Deep DOM Inspection (Now mandatory for proof extraction)
                // Even if we found the provider via script, we MUST find the text for the USER'S PROOF
                const bannerInfo = await page.evaluate(() => {
                  const deepQuerySelector = (selector: string, root: Document | ShadowRoot = document): HTMLElement | null => {
                    const el = root.querySelector(selector) as HTMLElement;
                    if (el) return el;
                    for (const node of Array.from(root.querySelectorAll('*'))) {
                      if ((node as HTMLElement).shadowRoot) {
                        const found = deepQuerySelector(selector, (node as HTMLElement).shadowRoot!);
                        if (found) return found;
                      }
                    }
                    return null;
                  };

                  const isVisible = (el: HTMLElement) => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 10 && rect.height > 10;
                  };

                  const selectors = [
                    '#CybotCookiebotDialog', '#onetrust-banner-sdk', '.cky-consent-container', '.osano-cm-window',
                    '#sp-consent-notice', '#qc-cmp2-container', '#cookie-law-info-bar', '.cc-window', '#CookieConsent',
                    '[id*="cookie-banner" i]', '[class*="cookie-banner" i]', '[id*="cookieconsent" i]', '[class*="cookie-consent" i]',
                    '[role="dialog"][aria-label*="cookie" i]', '[role="alertdialog"][aria-label*="cookie" i]',
                    '.tcf-consent-layer', '.trustecm-banner'
                  ];

                  // 1. Try known selectors
                  for (const s of selectors) {
                    const el = deepQuerySelector(s);
                    if (el && isVisible(el)) {
                      return { text: el.innerText || el.textContent || '', selector: s };
                    }
                  }

                  // 2. Generic Heuristic Search
                  const findGeneric = (root: Document | ShadowRoot): { text: string; selector: string } | null => {
                    const candidates = Array.from(root.querySelectorAll('div, section, aside, dialog, [role="dialog"]')) as HTMLElement[];
                    for (const el of candidates) {
                      if (!isVisible(el)) continue;
                      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
                      const lowerText = text.toLowerCase();
                      
                      // Filter for cookie banner characteristics
                      const hasKeywords = /(cookie|consent|privacy|gdpr|akceptuj|cookies)/i.test(lowerText);
                      const hasChoices = /(accept|allow|agree|reject|manage|preferences|settings|customize|decline)/i.test(lowerText);
                      const isSticky = ['fixed', 'sticky'].includes(window.getComputedStyle(el).position);
                      const zIndex = parseInt(window.getComputedStyle(el).zIndex) || 0;
                      
                      if (hasKeywords && hasChoices && (isSticky || zIndex > 10 || text.length < 1000)) {
                        return { text, selector: `heuristic:${el.tagName}` };
                      }
                    }
                    
                    // Recurse into shadows
                    for (const node of Array.from(root.querySelectorAll('*'))) {
                      if ((node as HTMLElement).shadowRoot) {
                        const found = findGeneric((node as HTMLElement).shadowRoot!);
                        if (found) return found;
                      }
                    }
                    return null;
                  };

                  return findGeneric(document);
                }).catch(() => null);

                if (bannerInfo && bannerInfo.text) {
                  complianceSignals.hasCmpBanner = true;
                  const cleanText = bannerInfo.text.replace(/\s+/g, ' ').trim().substring(0, 600);
                  complianceSignals.bannerEvidence = { 
                    url: currentUrl, 
                    snippet: cleanText || `Cookie banner detected (${bannerInfo.selector})` 
                  };
                  this.logger.log(`Banner text captured from ${currentUrl} (${bannerInfo.selector})`);
                }

                // Method 3: Proteccio-Specific & Proteccio-Managed check
                if (!complianceSignals.hasCmpBanner) {
                  const proteccioDetected = await page.evaluate(() => {
                    return !!(document.querySelector('[data-proteccio-banner]') || (window as any).__proteccioCMP);
                  }).catch(() => false);
                  
                  if (proteccioDetected) {
                    complianceSignals.hasCmpBanner = true;
                    complianceSignals.cmpProvider = 'Proteccio';
                    complianceSignals.bannerEvidence = { url: currentUrl, snippet: 'Proteccio consent management platform detected.' };
                  }
                }

              } catch (e) {
                this.logger.warn(`Banner detection failed on ${currentUrl}: ${e.message}`);
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
                // Use a wider context for proof
                const start = Math.max(0, idx - 60);
                const end = Math.min(text.length, idx + 140);
                return '...' + text.substring(start, end).replace(/\s+/g, ' ').trim() + '...';
              };

              // Prioritize using mainText for snippets to avoid footer/header noise
              const textForSnippet = pageMainText || pageText;

              if (allTypes.includes('PRIVACY_POLICY')) {
                const currentConfidence = calculatePrivacyConfidence(pageUrl, pageTitle);
                const previousConfidence = complianceSignals.privacyPolicyConfidence || -1000;

                // Always prefer the higher confidence page
                if (currentConfidence > previousConfidence || !complianceSignals.privacyPolicyEvidence) {
                  const privacySnippet = extractSnippet(textForSnippet, 'privacy policy') ||
                    extractSnippet(textForSnippet, 'privacy notice') ||
                    extractSnippet(textForSnippet, 'personal data') ||
                    extractSnippet(textForSnippet, 'personal information') ||
                    textForSnippet.substring(0, 250).replace(/\s+/g, ' ').trim();
                  
                  const fullProof = pageTitle ? `[${pageTitle}] ${privacySnippet}` : privacySnippet;
                  
                  complianceSignals.privacyPolicyEvidence = {
                    url: pageUrl,
                    snippet: fullProof,
                  };
                  complianceSignals.privacyPolicyConfidence = currentConfidence;
                }
              }

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

            // ── Link Extraction ────────────────────────────────────────────
            // Only extract and follow new links if the current page is INTERNAL.
            // If we are visiting an allowed external policy page, we treat it as a "leaf" node 
            // and don't crawl further into the third-party domain.
            let isCurrentPageInternal = true;
            try {
              isCurrentPageInternal = getBaseDomain(new URL(pageUrl).hostname) === baseDomain;
            } catch {}

            if (isCurrentPageInternal) {
              const links = await page.evaluate(() => {
                const results: string[] = [];
                // Standard links
                document.querySelectorAll('a[href], area[href], link[rel="canonical"][href], link[rel="alternate"][href]').forEach(el => {
                  const href = (el as HTMLAnchorElement | HTMLAreaElement | HTMLLinkElement).href;
                  if (href) results.push(href);
                });
                // Shadow DOM links
                const walk = (node: Node) => {
                  if (node instanceof HTMLElement && node.shadowRoot) {
                    node.shadowRoot.querySelectorAll('a[href], area[href]').forEach(el => {
                      const href = (el as HTMLAnchorElement | HTMLAreaElement).href;
                      if (href) results.push(href);
                    });
                    Array.from(node.shadowRoot.children).forEach(walk);
                  }
                  Array.from(node.childNodes).forEach(walk);
                };
                walk(document.body);
                return results;
              }).catch(() => []);

              for (const link of links) {
                enqueueDiscoveredUrl(link, POLICY_LINK_PATTERN.test(link), `page-link:${pageUrl}`);
              }
            } else {
              this.logger.log(`External leaf page reached: ${pageUrl}. Skipping further link extraction.`);
            }

          } catch (err) {
            this.logger.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
            recordSkippedUrl({
              url: currentUrl,
              source: currentSource,
              finalUrl: page.url() || currentUrl,
              reason: `crawl-error:${err.message}`,
            });
          } finally {
            await page.close();
          }
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

      const thirdPartyDomains = Array.from(thirdPartyDomainsSet)
        .filter(isMeaningfulThirdPartyDomain)
        .sort();

      // ── Finalize ───────────────────────────────────────────────────────
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: {
          status: ScanStatus.COMPLETED,
          lastScan: new Date(),
          pagesCrawled: crawledPageUrls.size,
          cookiesDetected: discoveredCookies.size,
        },
      });

      await this.complianceScanner.evaluateCompliance(
        websiteId,
        discoveredCookies.size,
        Array.from(crawledPageUrls),
        thirdPartyDomains,   // Now network-captured, not DOM-scraped
        complianceSignals,
        Array.from(discoveredCookies.values()),
      );

      const complianceSnapshot = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        select: { scanResults: true },
      });
      const indicatorResults = Array.isArray(complianceSnapshot?.scanResults)
        ? (complianceSnapshot.scanResults as any[]).filter(i => i?.id !== 'crawl_debug')
        : [];
      const scanDebugEntry = {
        id: 'crawl_debug',
        name: 'Scan Trace',
        type: 'debug',
        passed: true,
        score: 0,
        weight: 0,
        details: `${crawlDebugTotals.crawled} page(s) crawled, ${crawlDebugTotals.skipped} URL(s) skipped.`,
        debug: {
          generatedAt: new Date().toISOString(),
          startUrl: website.url,
          baseDomain,
          totals: {
            ...crawlDebugTotals,
            queuedUnique: enqueued.size,
            visitedUnique: visited.size,
            crawledUnique: crawledPageUrls.size,
          },
          truncated: {
            crawled: crawlDebugCrawled.length < crawlDebugTotals.crawled,
            skipped: crawlDebugSkipped.length < crawlDebugTotals.skipped,
            maxEntriesPerList: MAX_SCAN_DEBUG_ENTRIES,
          },
          crawled: crawlDebugCrawled,
          skipped: crawlDebugSkipped,
        },
      };
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: {
          scanResults: [...indicatorResults, scanDebugEntry] as any,
        },
      });

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
            totalPages: crawledPageUrls.size,
            scanType: website.depth,
            scanFrequency: website.frequency,
            scanDate: new Date().toLocaleString(),
            cookieCount: discoveredCookies.size,
            necessaryCount: categoryCounts['NECESSARY'],
            functionalCount: categoryCounts['FUNCTIONAL'],
            analyticsCount: categoryCounts['ANALYTICS'],
            marketingCount: categoryCounts['MARKETING'],
            unknownCount: categoryCounts['UNCATEGORIZED'],
            thirdPartyDomains,
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

      this.logger.log(`Scan complete: ${website.url} | Pages: ${crawledPageUrls.size} | Cookies: ${discoveredCookies.size} | 3P Domains: ${thirdPartyDomains.length}`);
      return { cookiesFound: discoveredCookies.size, pagesScanned: crawledPageUrls.size };

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
