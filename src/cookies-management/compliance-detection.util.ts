/**
 * Shared helpers for compliance signal validation (scanner + heuristics).
 */

/** WordPress/blog paths that are never dedicated legal policy pages */
export const ARCHIVE_LISTING_URL_PATTERN =
  /\/(?:category|categories|tag|tags|author|archive|page|blog|posts|topic|topics|feed|wp-json|indian-law-blog)(?:\/|$)/i;

/** Dedicated privacy notice URL paths (full segment match, not "data-privacy" blog topics) */
export const DEDICATED_PRIVACY_URL_PATTERN =
  /\/(?:privacy(?:-policy|-notice|-statement|-center)?|data-protection|legal\/privacy|legal\/privacy-policy|privacidad|datenschutz)(?:\/|$)/i;

export const DEDICATED_COOKIE_URL_PATTERN =
  /\/(?:cookie(?:-policy|-notice|-declaration|-statement)?|cookies(?:-policy)?|legal\/cookie-policy)(?:\/|$)/i;

/** Path segments that look like ISO codes but are common blog/topic slugs (not languages) */
export const PATH_SEGMENT_LANG_BLOCKLIST = new Set([
  'ma', 'us', 'uk', 'in', 'eu', 'ai', 'ar', 'id', 'me', 'be', 'or', 'no',
  'is', 'it', 'at', 'by', 'to', 'do', 'go', 'my', 'we', 'he', 'as', 'an',
  'ad', 'tv', 'fm', 'am', 'pm', 'cd', 'tv', 'pc', 'os', 'ui', 'ux', 'hr',
  'pr', 'qa', 'se', 'es', 'gst', 'dpdp', 'gdpr', 'ccpa', 'rbi', 'sebi',
]);

export function isBlogOrArchiveUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (ARCHIVE_LISTING_URL_PATTERN.test(path)) return true;
    if (/\/(?:sitemap|search|feed)(?:\/|$)/i.test(path)) return true;
    if (/\/\d{4}(?:\/\d{2})?(?:\/|$)/.test(path)) return true;
    return false;
  } catch {
    return false;
  }
}

export function isDedicatedPrivacyPolicyUrl(url: string): boolean {
  if (isBlogOrArchiveUrl(url)) return false;
  try {
    return DEDICATED_PRIVACY_URL_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function isDedicatedCookiePolicyUrl(url: string): boolean {
  if (isBlogOrArchiveUrl(url)) return false;
  try {
    return DEDICATED_COOKIE_URL_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Reject compound slugs like "data-privacy" (legal blog category, not a privacy notice page) */
export function urlImpliesPrivacyPolicy(url: string): boolean {
  return isDedicatedPrivacyPolicyUrl(url);
}

export function urlImpliesCookiePolicy(url: string): boolean {
  return isDedicatedCookiePolicyUrl(url);
}

/**
 * Validates text extracted as cookie-banner proof (reduces homepage/marketing false positives).
 */
export function isValidCookieBannerSnippet(text: string): boolean {
  if (!text || text.length < 20) return false;

  const lower = text.toLowerCase().replace(/\s+/g, ' ').trim();

  const hasCookieContext =
    /\b(cookie|cookies|consent|gdpr|ccpa|dpdp|tracking technologies|we use cookies|this (site|website) uses cookies)\b/i.test(
      lower,
    );
  if (!hasCookieContext) return false;

  const hasConsentAction =
    /\b(accept all|accept cookies|reject all|decline all|deny|allow all|manage preferences|cookie settings|customize|i agree|got it|only necessary|necessary only)\b/i.test(
      lower,
    );
  if (!hasConsentAction) return false;

  const marketingOnly =
    /\b(welcome to|read more|law firm|advocates|our services|about us|legal strategists|comprehensive legal)\b/i.test(
      lower,
    ) && !/\b(we use cookies|cookie(s)? (policy|preferences|settings)|consent (to|for))\b/i.test(lower);

  if (marketingOnly) return false;

  if (lower.length > 1400) return false;

  return true;
}

export function isPathSegmentLikelyLanguage(code: string): boolean {
  const norm = code.toLowerCase().split('-')[0];
  if (PATH_SEGMENT_LANG_BLOCKLIST.has(norm)) return false;
  if (norm.length !== 2) return false;
  return true;
}

export function scorePrivacyPolicyPage(url: string, title: string, mainTextSample = ''): number {
  let score = 0;
  if (isDedicatedPrivacyPolicyUrl(url)) score += 100;
  if (isBlogOrArchiveUrl(url)) score -= 80;

  const titleLower = (title || '').toLowerCase();
  const textLower = (mainTextSample || '').slice(0, 3000).toLowerCase();

  if (/^privacy (policy|notice|statement)/i.test(titleLower)) score += 40;
  if (/\bprivacy (policy|notice|statement)\b/.test(titleLower)) score += 20;
  if (/\bdata privacy\b/.test(titleLower) && !isDedicatedPrivacyPolicyUrl(url)) score -= 30;

  const policyBodySignals = [
    'personal data',
    'personal information',
    'data controller',
    'data processor',
    'your rights',
    'lawful basis',
    'information we collect',
  ];
  const hits = policyBodySignals.filter((s) => textLower.includes(s)).length;
  score += hits * 8;

  const blogListingSignals = ['read more', 'posted on', 'leave a comment', 'category:', 'tag:'];
  if (blogListingSignals.filter((s) => textLower.includes(s)).length >= 2) score -= 40;

  if (isBlogOrArchiveUrl(url) && !isDedicatedPrivacyPolicyUrl(url)) {
    return Math.min(score, 54);
  }

  return score;
}
