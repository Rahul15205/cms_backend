import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enterprise-grade Cookie Classification Service
 * 
 * Uses a 5-tier classification strategy inspired by OneTrust/Cookiebot:
 *   Tier 1: Exact name match against Open Cookie Database (2,200+ cookies)
 *   Tier 2: Wildcard/prefix match (e.g., _ga_ matches _ga_*)
 *   Tier 3: Domain-based heuristic (e.g., google-analytics.com → Analytics)
 *   Tier 4: Name pattern heuristic (e.g., "sess" in name → Necessary)
 *   Tier 5: Uncategorized fallback
 */

export interface CookieClassification {
  name: string;
  platform: string;
  category: string;
  description: string;
  retention: string;
  dataController: string;
  confidence: number;     // 0-100
  classificationTier: number; // 1-5
}

interface DatabaseEntry {
  name: string;
  platform: string;
  category: string;
  description: string;
  retention: string;
  dataController: string;
  domain?: string;
}

interface CookieDatabase {
  version: string;
  totalEntries: number;
  exactMatchCount?: number;
  wildcardCount?: number;
  domainPatternsCount?: number;
  exactMatch: Record<string, DatabaseEntry>;
  wildcardPatterns: DatabaseEntry[];
  domainPatterns: Record<string, string>;
}

// Domain → Category mapping for Tier 3
const DOMAIN_CATEGORY_MAP: Record<string, { category: string; platform: string }> = {
  'google-analytics.com': { category: 'ANALYTICS', platform: 'Google Analytics' },
  'googletagmanager.com': { category: 'ANALYTICS', platform: 'Google Tag Manager' },
  'googleadservices.com': { category: 'ADVERTISING', platform: 'Google Ads' },
  'googlesyndication.com': { category: 'ADVERTISING', platform: 'Google AdSense' },
  'doubleclick.net': { category: 'ADVERTISING', platform: 'DoubleClick' },
  'facebook.com': { category: 'ADVERTISING', platform: 'Facebook' },
  'facebook.net': { category: 'ADVERTISING', platform: 'Facebook' },
  'fbcdn.net': { category: 'ADVERTISING', platform: 'Facebook' },
  'twitter.com': { category: 'ADVERTISING', platform: 'X (Twitter)' },
  'linkedin.com': { category: 'ADVERTISING', platform: 'LinkedIn' },
  'ads-twitter.com': { category: 'ADVERTISING', platform: 'X (Twitter)' },
  'bing.com': { category: 'ADVERTISING', platform: 'Microsoft Bing' },
  'microsoft.com': { category: 'FUNCTIONAL', platform: 'Microsoft' },
  'hotjar.com': { category: 'ANALYTICS', platform: 'Hotjar' },
  'hotjar.io': { category: 'ANALYTICS', platform: 'Hotjar' },
  'clarity.ms': { category: 'ANALYTICS', platform: 'Microsoft Clarity' },
  'hubspot.com': { category: 'ANALYTICS', platform: 'HubSpot' },
  'hs-analytics.net': { category: 'ANALYTICS', platform: 'HubSpot' },
  'intercom.io': { category: 'FUNCTIONAL', platform: 'Intercom' },
  'zendesk.com': { category: 'FUNCTIONAL', platform: 'Zendesk' },
  'tawk.to': { category: 'FUNCTIONAL', platform: 'Tawk.to' },
  'crisp.chat': { category: 'FUNCTIONAL', platform: 'Crisp' },
  'amplitude.com': { category: 'ANALYTICS', platform: 'Amplitude' },
  'mixpanel.com': { category: 'ANALYTICS', platform: 'Mixpanel' },
  'segment.com': { category: 'ANALYTICS', platform: 'Segment' },
  'segment.io': { category: 'ANALYTICS', platform: 'Segment' },
  'heap.io': { category: 'ANALYTICS', platform: 'Heap' },
  'heapanalytics.com': { category: 'ANALYTICS', platform: 'Heap' },
  'fullstory.com': { category: 'ANALYTICS', platform: 'FullStory' },
  'logrocket.com': { category: 'ANALYTICS', platform: 'LogRocket' },
  'sentry.io': { category: 'FUNCTIONAL', platform: 'Sentry' },
  'cloudflare.com': { category: 'NECESSARY', platform: 'Cloudflare' },
  'cloudflareinsights.com': { category: 'ANALYTICS', platform: 'Cloudflare' },
  'stripe.com': { category: 'NECESSARY', platform: 'Stripe' },
  'paypal.com': { category: 'NECESSARY', platform: 'PayPal' },
  'youtube.com': { category: 'ADVERTISING', platform: 'YouTube' },
  'youtu.be': { category: 'ADVERTISING', platform: 'YouTube' },
  'vimeo.com': { category: 'FUNCTIONAL', platform: 'Vimeo' },
  'tiktok.com': { category: 'ADVERTISING', platform: 'TikTok' },
  'snapchat.com': { category: 'ADVERTISING', platform: 'Snapchat' },
  'pinterest.com': { category: 'ADVERTISING', platform: 'Pinterest' },
  'reddit.com': { category: 'ADVERTISING', platform: 'Reddit' },
  'quora.com': { category: 'ADVERTISING', platform: 'Quora' },
  'outbrain.com': { category: 'ADVERTISING', platform: 'Outbrain' },
  'taboola.com': { category: 'ADVERTISING', platform: 'Taboola' },
  'criteo.com': { category: 'ADVERTISING', platform: 'Criteo' },
  'criteo.net': { category: 'ADVERTISING', platform: 'Criteo' },
  'adform.net': { category: 'ADVERTISING', platform: 'Adform' },
  'pubmatic.com': { category: 'ADVERTISING', platform: 'PubMatic' },
  'rubiconproject.com': { category: 'ADVERTISING', platform: 'Rubicon Project' },
  'casalemedia.com': { category: 'ADVERTISING', platform: 'Casale Media' },
  'demdex.net': { category: 'ADVERTISING', platform: 'Adobe Audience Manager' },
  'scorecardresearch.com': { category: 'ANALYTICS', platform: 'ComScore' },
  'quantserve.com': { category: 'ANALYTICS', platform: 'Quantcast' },
  'cookiebot.com': { category: 'FUNCTIONAL', platform: 'Cookiebot' },
  'onetrust.com': { category: 'FUNCTIONAL', platform: 'OneTrust' },
  'cookieinformation.com': { category: 'FUNCTIONAL', platform: 'Cookie Information' },
  'osano.com': { category: 'FUNCTIONAL', platform: 'Osano' },
  'iubenda.com': { category: 'FUNCTIONAL', platform: 'Iubenda' },
  'recaptcha.net': { category: 'NECESSARY', platform: 'Google reCAPTCHA' },
  'gstatic.com': { category: 'FUNCTIONAL', platform: 'Google' },
  'jsdelivr.net': { category: 'NECESSARY', platform: 'jsDelivr CDN' },
  'cdnjs.cloudflare.com': { category: 'NECESSARY', platform: 'cdnjs' },
  'unpkg.com': { category: 'NECESSARY', platform: 'unpkg CDN' },
};

// Tier 4: Name-based pattern heuristics
const NAME_PATTERNS: { pattern: RegExp; category: string; platform: string; description: string }[] = [
  // Necessary / Security
  { pattern: /^(csrf|xsrf|_csrf|__csrf)/i, category: 'NECESSARY', platform: 'Security', description: 'Cross-Site Request Forgery protection token.' },
  { pattern: /^(PHPSESSID|JSESSIONID|ASP\.NET_SessionId|connect\.sid|session_id|sessid)/i, category: 'NECESSARY', platform: 'Web Server', description: 'Server-side session identifier.' },
  { pattern: /^(__cf_bm|__cfduid|__cfruid|cf_clearance|cf_chl)/i, category: 'NECESSARY', platform: 'Cloudflare', description: 'Cloudflare security and bot management cookie.' },
  { pattern: /^(AWSALB|AWSELBCORS|AWSELB)/i, category: 'NECESSARY', platform: 'AWS', description: 'AWS load balancer session affinity cookie.' },
  { pattern: /^(ARRAffinity)/i, category: 'NECESSARY', platform: 'Azure', description: 'Azure load balancer session affinity cookie.' },
  { pattern: /^(XSRF-TOKEN|X-XSRF-TOKEN)/i, category: 'NECESSARY', platform: 'Security', description: 'Anti-CSRF security token.' },
  { pattern: /(sess|session)/i, category: 'NECESSARY', platform: 'Web Server', description: 'Session management cookie.' },
  { pattern: /^(laravel_session|laravel_token)/i, category: 'NECESSARY', platform: 'Laravel', description: 'Laravel framework session cookie.' },
  { pattern: /^(__Secure-|__Host-)/i, category: 'NECESSARY', platform: 'Security', description: 'Secure cookie with browser-enforced restrictions.' },
  { pattern: /(security|authentication|login|session_?mgmt|load_?balancing|server_?affinity|failover|csrf|xsrf|anti-forgery|tamper|token)/i, category: 'NECESSARY', platform: 'Infrastructure & Security', description: 'Essential security or infrastructure management cookie.' },
  { pattern: /(cart|checkout|payment|inventory|reservation|wishlist|coupon)/i, category: 'NECESSARY', platform: 'E-commerce', description: 'Necessary for e-commerce transactions and state management.' },
  { pattern: /(sso|federated|identity|api_?session|cdn_?routing|vpn_?session|infrastructure)/i, category: 'NECESSARY', platform: 'Enterprise Infrastructure', description: 'Corporate identity or infrastructure routing cookie.' },

  // Functional
  { pattern: /^(cookie_?consent|cookieconsent|CookieConsent)/i, category: 'FUNCTIONAL', platform: 'Consent Management', description: 'Stores user cookie consent preferences.' },
  { pattern: /(lang|locale|language|i18n)/i, category: 'FUNCTIONAL', platform: 'Localization', description: 'Stores user language or locale preference.' },
  { pattern: /(theme|dark_?mode|color_?scheme)/i, category: 'FUNCTIONAL', platform: 'UI Preference', description: 'Stores user display theme preference.' },
  { pattern: /(timezone|tz)/i, category: 'FUNCTIONAL', platform: 'Localization', description: 'Stores user timezone setting.' },
  { pattern: /^(pref|preference)/i, category: 'FUNCTIONAL', platform: 'Preferences', description: 'Stores user preferences.' },
  { pattern: /(accessibility|font_?pref|ui_?personalization|remember_?me|auto_?fill|player|playback)/i, category: 'FUNCTIONAL', platform: 'UI Customization', description: 'Enhances user interface and media playback experience.' },
  { pattern: /(social_?login|social_?share|chat_?support|messaging|notification_?pref)/i, category: 'FUNCTIONAL', platform: 'Communication & Social', description: 'Enables social sharing and real-time communication features.' },
  { pattern: /(consent|banner|opt_?in|opt_?out|privacy_?pref)/i, category: 'FUNCTIONAL', platform: 'Compliance', description: 'Stores user consent and privacy preferences.' },

  // Analytics
  { pattern: /^(_ga|_gid|_gat|__utm)/i, category: 'ANALYTICS', platform: 'Google Analytics', description: 'Google Analytics tracking cookie.' },
  { pattern: /^(_hj|_hp2)/i, category: 'ANALYTICS', platform: 'Hotjar', description: 'Hotjar analytics and behavior tracking cookie.' },
  { pattern: /^(_cl[cs]k|CLID|SM)/i, category: 'ANALYTICS', platform: 'Microsoft Clarity', description: 'Microsoft Clarity session recording cookie.' },
  { pattern: /^(__hstc|hubspotutk|__hssc|__hssrc)/i, category: 'ANALYTICS', platform: 'HubSpot', description: 'HubSpot analytics tracking cookie.' },
  { pattern: /^(amplitude|amp_)/i, category: 'ANALYTICS', platform: 'Amplitude', description: 'Amplitude analytics cookie.' },
  { pattern: /^(mp_|mixpanel)/i, category: 'ANALYTICS', platform: 'Mixpanel', description: 'Mixpanel analytics cookie.' },
  { pattern: /^(ajs_|ajs_anonymous_id|ajs_user_id)/i, category: 'ANALYTICS', platform: 'Segment', description: 'Segment analytics cookie.' },
  { pattern: /^(s_cc|s_sq|s_vi|s_fid|s_ecid)/i, category: 'ANALYTICS', platform: 'Adobe Analytics', description: 'Adobe Analytics tracking cookie.' },
  { pattern: /(analytic|tracking|_track)/i, category: 'ANALYTICS', platform: 'Analytics', description: 'Website analytics tracking cookie.' },
  { pattern: /(performance|statistics|audience|traffic|behavioral_?analytics|heatmap|ab_?testing|conversion)/i, category: 'ANALYTICS', platform: 'Measurement', description: 'Measures website performance and user behavior statistics.' },
  { pattern: /(engagement|event_?track|user_?journey|diagnostic|error_?monitor)/i, category: 'ANALYTICS', platform: 'Monitoring', description: 'Tracks user engagement and monitors site health/errors.' },

  // Advertising / Marketing
  { pattern: /^(_fbp|_fbc|fbm_|fbs_)/i, category: 'ADVERTISING', platform: 'Facebook', description: 'Facebook advertising and tracking pixel cookie.' },
  { pattern: /^(_gcl_|gcl_|FPGCL)/i, category: 'ADVERTISING', platform: 'Google Ads', description: 'Google Ads conversion tracking cookie.' },
  { pattern: /^(IDE|DSID|FLC|RUL)/i, category: 'ADVERTISING', platform: 'DoubleClick', description: 'DoubleClick/Google Marketing ad targeting cookie.' },
  { pattern: /^(_uet|_uetvid|_uetsid|MUID)/i, category: 'ADVERTISING', platform: 'Microsoft Ads', description: 'Microsoft/Bing advertising tracking cookie.' },
  { pattern: /^(li_|ln_|bcookie|bscookie|UserMatchHistory)/i, category: 'ADVERTISING', platform: 'LinkedIn', description: 'LinkedIn advertising and tracking cookie.' },
  { pattern: /^(guest_id|personalization_id|ct0)/i, category: 'ADVERTISING', platform: 'X (Twitter)', description: 'X/Twitter advertising and tracking cookie.' },
  { pattern: /^(_pin_|_pinterest)/i, category: 'ADVERTISING', platform: 'Pinterest', description: 'Pinterest advertising cookie.' },
  { pattern: /(advert|campaign|promo|banner_?id|click_?id)/i, category: 'ADVERTISING', platform: 'Advertising', description: 'Advertising or campaign tracking cookie.' },
  { pattern: /(targeting|retargeting|remarketing|affiliate|referral|impression|programmatic|capping)/i, category: 'ADVERTISING', platform: 'Marketing', description: 'Personalized marketing and ad performance tracking cookie.' },
  { pattern: /(uid|uuid|fingerprint|profiling|telemetry|supercookie|zombie|evercookie|respawn|pixel)/i, category: 'ADVERTISING', platform: 'Tracking & Profiling', description: 'Persistent tracking mechanism for user profiling and cross-device identification.' },
  { pattern: /(flash|lso|etag|canvas|indexeddb|websql|service_?worker)/i, category: 'ADVERTISING', platform: 'Advanced Tracking', description: 'Advanced storage mechanism used for persistent tracking.' },
];

@Injectable()
export class CookieClassifierService implements OnModuleInit {
  private readonly logger = new Logger(CookieClassifierService.name);
  private database: CookieDatabase | null = null;
  private isLoaded = false;

  onModuleInit() {
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      const dbPath = path.join(__dirname, 'cookie-database.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        this.database = JSON.parse(raw);
        this.isLoaded = true;
        const db = this.database!;
        this.logger.log(
          `Cookie Database loaded: ${db.totalEntries} entries ` +
          `(${db.exactMatchCount || Object.keys(db.exactMatch).length} exact, ` +
          `${db.wildcardCount || db.wildcardPatterns.length} wildcard, ` +
          `${db.domainPatternsCount || Object.keys(db.domainPatterns).length} domains) ` +
          `v${db.version}`
        );
      } else {
        this.logger.warn(
          `Cookie Database not found at ${dbPath}. ` +
          `Run "node scripts/parse-cookie-database.js" to generate it. ` +
          `Falling back to pattern-only classification.`
        );
      }
    } catch (err) {
      this.logger.error(`Failed to load Cookie Database: ${err.message}`);
    }
  }

  /**
   * Classify a cookie using the 5-tier enterprise strategy.
   * Returns the best classification with confidence score.
   */
  classify(cookieName: string, cookieDomain?: string): CookieClassification {
    const name = cookieName.trim();

    // Tier 1: Exact match
    if (this.database?.exactMatch) {
      const exact = this.database.exactMatch[name];
      if (exact) {
        return {
          name: exact.name,
          platform: exact.platform,
          category: exact.category,
          description: exact.description,
          retention: exact.retention,
          dataController: exact.dataController,
          confidence: 100,
          classificationTier: 1,
        };
      }
    }

    // Tier 2: Wildcard/prefix match
    if (this.database?.wildcardPatterns) {
      for (const pattern of this.database.wildcardPatterns) {
        if (name.startsWith(pattern.name)) {
          return {
            name: pattern.name,
            platform: pattern.platform,
            category: pattern.category,
            description: pattern.description,
            retention: pattern.retention,
            dataController: pattern.dataController,
            confidence: 95,
            classificationTier: 2,
          };
        }
      }
    }

    // Tier 3: Domain-based heuristic
    if (cookieDomain) {
      const cleanDomain = cookieDomain.replace(/^\./, '').toLowerCase();
      
      // Check database domain patterns
      if (this.database?.domainPatterns) {
        for (const [domainKey, category] of Object.entries(this.database.domainPatterns)) {
          if (cleanDomain.includes(domainKey.replace(/\(3rd party\)/i, '').trim().toLowerCase())) {
            return {
              name,
              platform: domainKey,
              category: category as string,
              description: `Cookie from ${domainKey}.`,
              retention: 'Unknown',
              dataController: 'Unknown',
              confidence: 85,
              classificationTier: 3,
            };
          }
        }
      }

      // Check hardcoded domain map
      for (const [domain, info] of Object.entries(DOMAIN_CATEGORY_MAP)) {
        if (cleanDomain.includes(domain)) {
          return {
            name,
            platform: info.platform,
            category: info.category,
            description: `Cookie set by ${info.platform}.`,
            retention: 'Unknown',
            dataController: info.platform,
            confidence: 80,
            classificationTier: 3,
          };
        }
      }
    }

    // Tier 4: Name pattern heuristic
    for (const { pattern, category, platform, description } of NAME_PATTERNS) {
      if (pattern.test(name)) {
        return {
          name,
          platform,
          category,
          description,
          retention: 'Unknown',
          dataController: 'Unknown',
          confidence: 60,
          classificationTier: 4,
        };
      }
    }

    // Tier 5: Uncategorized
    return {
      name,
      platform: 'Unknown',
      category: 'UNCATEGORIZED',
      description: 'Cookie discovered during scan — not found in any known database.',
      retention: 'Unknown',
      dataController: 'Unknown',
      confidence: 0,
      classificationTier: 5,
    };
  }

  /**
   * Classify a localStorage/sessionStorage key using heuristics.
   */
  classifyStorageKey(key: string, type: 'localStorage' | 'sessionStorage'): CookieClassification {
    // Try the standard cookie classification first
    const result = this.classify(key);
    
    if (result.classificationTier <= 2) {
      // Found in database — trust it
      return result;
    }

    // Additional storage-specific patterns
    const storagePatterns: { pattern: RegExp; category: string; platform: string; description: string }[] = [
      { pattern: /^(amplitude|amp_)/i, category: 'ANALYTICS', platform: 'Amplitude', description: `Amplitude analytics data in ${type}.` },
      { pattern: /^(intercom|ic_)/i, category: 'FUNCTIONAL', platform: 'Intercom', description: `Intercom chat widget data in ${type}.` },
      { pattern: /^(segment|ajs_)/i, category: 'ANALYTICS', platform: 'Segment', description: `Segment analytics data in ${type}.` },
      { pattern: /^(hubspot|hs_|__hs)/i, category: 'ANALYTICS', platform: 'HubSpot', description: `HubSpot tracking data in ${type}.` },
      { pattern: /^(crisp|CRISP_)/i, category: 'FUNCTIONAL', platform: 'Crisp', description: `Crisp chat data in ${type}.` },
      { pattern: /^(drift|driftt_)/i, category: 'FUNCTIONAL', platform: 'Drift', description: `Drift chat data in ${type}.` },
      { pattern: /^(mp_|mixpanel)/i, category: 'ANALYTICS', platform: 'Mixpanel', description: `Mixpanel analytics data in ${type}.` },
      { pattern: /^(_ga|_gid)/i, category: 'ANALYTICS', platform: 'Google Analytics', description: `Google Analytics data in ${type}.` },
      { pattern: /(token|auth|jwt|access_token|refresh_token)/i, category: 'NECESSARY', platform: 'Authentication', description: `Authentication token stored in ${type}.` },
      { pattern: /(cart|basket|checkout)/i, category: 'NECESSARY', platform: 'E-commerce', description: `Shopping cart data stored in ${type}.` },
      { pattern: /(theme|darkmode|color-scheme)/i, category: 'FUNCTIONAL', platform: 'UI', description: `UI theme preference stored in ${type}.` },
    ];

    for (const { pattern, category, platform, description } of storagePatterns) {
      if (pattern.test(key)) {
        return {
          name: key,
          platform,
          category,
          description,
          retention: type === 'sessionStorage' ? 'Session' : 'Persistent',
          dataController: 'Unknown',
          confidence: 55,
          classificationTier: 4,
        };
      }
    }

    return result; // Return whatever Tier 4/5 result we got from standard classification
  }

  /**
   * Get statistics about the loaded database.
   */
  getStats() {
    return {
      loaded: this.isLoaded,
      version: this.database?.version || 'N/A',
      totalEntries: this.database?.totalEntries || 0,
      exactMatches: this.database ? Object.keys(this.database.exactMatch).length : 0,
      wildcardPatterns: this.database?.wildcardPatterns?.length || 0,
      domainPatterns: this.database ? Object.keys(this.database.domainPatterns).length : 0,
      hardcodedDomains: Object.keys(DOMAIN_CATEGORY_MAP).length,
      namePatterns: NAME_PATTERNS.length,
    };
  }
}
