import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScannedWebsite, CookieBanner } from '@prisma/client';

const PRIVACY_LINK_PATTERN = /privacy|privacy[-_]?policy|privacy[-_]?notice|privacy[-_]?statement|privacy[-_]?center|data[-_]?protection|datenschutz|privacidad/i;
const COOKIE_LINK_PATTERN = /cookies?|cookie[-_]?policy|cookies[-_]?policy|cookie[-_]?notice|cookie[-_]?declaration|cookie[-_]?statement/i;

export interface ComplianceIndicator {
  id: string;
  name: string;
  weight: number;
  passed: boolean;
  score: number;
  details: string;
  evidence?: { url: string; snippet: string };
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class ComplianceScannerService {
  private readonly logger = new Logger(ComplianceScannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateCompliance(
    websiteId: string,
    discoveredCookiesCount: number,
    crawledLinks: string[],
    thirdPartyScripts: string[],
    signals?: any,
    discoveredCookies?: any[]
  ): Promise<void> {
    try {
      const website = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        include: { cookieBanners: true }
      });
      if (!website) return;

      const indicators = this.runHeuristics(website, crawledLinks, thirdPartyScripts, signals, discoveredCookies);

      const totalScore = Math.round(indicators.reduce((sum, i) => sum + i.score, 0));
      const riskLevel = this.calculateRisk(totalScore);
      const complianceGrade = this.calculateGrade(totalScore);

      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: {
          complianceScore: totalScore,
          riskLevel,
          complianceGrade,
          scanResults: indicators as any,
          thirdPartyScripts: thirdPartyScripts as any,
          previousScore: website.complianceScore || null,
          changeDetected: website.complianceScore !== totalScore
        }
      });

      this.logger.log(`Compliance for ${website.url}: ${totalScore}% | Grade: ${complianceGrade} | Risk: ${riskLevel} | CMP: ${signals?.cmpProvider || 'none'}`);
    } catch (error) {
      this.logger.error(`Error evaluating compliance: ${error.message}`);
    }
  }

  /**
   * Calculates a graduated score based on the ratio of passing items.
   * Instead of binary 0 or full marks, gives partial credit.
   */
  private graduatedScore(weight: number, passing: number, total: number): number {
    if (total === 0) return weight; // No items to check = full marks (nothing to fail)
    const ratio = passing / total;
    return Math.round(weight * ratio * 10) / 10; // One decimal precision
  }

  /**
   * Determines severity level based on failure percentage.
   */
  private calculateSeverity(failCount: number, total: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (total === 0 || failCount === 0) return 'LOW';
    const failRate = failCount / total;
    if (failRate >= 0.75) return 'CRITICAL';
    if (failRate >= 0.5) return 'HIGH';
    if (failRate >= 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private runHeuristics(
    website: ScannedWebsite & { cookieBanners: CookieBanner[] },
    crawledLinks: string[],
    thirdPartyScripts: string[],
    signals?: any,
    discoveredCookies?: any[]
  ): ComplianceIndicator[] {
    const indicators: ComplianceIndicator[] = [];

    // ── Banner Detection ────────────────────────────────────────────────────
    const hasProteccioBanner = website.cookieBanners && website.cookieBanners.length > 0;
    const hasExternalCmp = signals?.hasCmpBanner === true;
    const hasBanner = hasProteccioBanner || hasExternalCmp;
    const cmpProvider = hasProteccioBanner ? 'Proteccio' : (signals?.cmpProvider || null);

    // ── Page existence signals ──────────────────────────────────────────────
    const hasPrivacyPolicy = signals
      ? signals.hasPrivacyPolicy === true
      : crawledLinks.some(l => PRIVACY_LINK_PATTERN.test(l));

    const hasCookieNotice = signals
      ? signals.hasCookieNotice === true
      : crawledLinks.some(l => COOKIE_LINK_PATTERN.test(l));

    const httpCookies = (discoveredCookies || []).filter(c => c.type === 'HTTP_COOKIE');

    // ═══════════════════════════════════════════════════════════════════════
    // POLICY & GOVERNANCE INDICATORS (53 pts)
    // ═══════════════════════════════════════════════════════════════════════

    // ── 0. Pre-Consent Cookie Audit (7 pts) — NEW ───────────────────────
    // THE most important GDPR/DPDP check: Are non-essential cookies loading 
    // BEFORE the user gives consent? GDPR Art. 5(3) / DPDP Section 4 violation.
    const preConsentViolations: any[] = signals?.preConsentViolations || [];
    const preConsentTotal = signals?.preConsentCookieCount || 0;
    const preConsentPassed = preConsentViolations.length === 0;
    const violationNames = preConsentViolations.map((v: any) => v.name).slice(0, 5);

    indicators.push({
      id: 'pre_consent_audit',
      name: 'Pre-Consent Cookie Audit',
      weight: 7,
      passed: preConsentPassed,
      score: preConsentPassed ? 7 : this.graduatedScore(7, Math.max(0, preConsentTotal - preConsentViolations.length), preConsentTotal),
      severity: this.calculateSeverity(preConsentViolations.length, preConsentTotal),
      details: preConsentPassed
        ? preConsentTotal > 0
          ? `All ${preConsentTotal} cookie(s) detected before consent are essential (Necessary/Functional). No GDPR Art. 5(3) / DPDP Section 4 violations.`
          : 'No cookies detected before user consent — fully compliant with consent-first requirements.'
        : `${preConsentViolations.length} non-essential cookie(s) loaded BEFORE user consent${violationNames.length > 0 ? `: ${violationNames.join(', ')}${preConsentViolations.length > 5 ? ` (+${preConsentViolations.length - 5} more)` : ''}` : ''}. This violates GDPR Art. 5(3) and DPDP Section 4 — non-essential cookies must NOT be set until explicit consent is given.`,
      evidence: preConsentViolations.length > 0
        ? { url: website.url, snippet: `Pre-consent violations: ${violationNames.join(', ')}` }
        : undefined
    });

    // ── 1. Cookie Banner Installed (10 pts) ─────────────────────────────────
    // MOST CRITICAL: Without a banner, the site fundamentally fails consent compliance
    indicators.push({
      id: 'banner_installed',
      name: 'Cookie Banner Installed',
      weight: 10,
      passed: hasBanner,
      score: hasBanner ? 10 : 0,
      severity: hasBanner ? 'LOW' : 'CRITICAL',
      details: hasBanner
        ? `Cookie consent banner detected${cmpProvider ? ` (${cmpProvider})` : ''}. Users can manage their cookie preferences.`
        : 'No cookie consent banner detected. This is a critical GDPR/DPDP requirement — users must be able to give or withhold consent before non-essential cookies are set.',
      evidence: signals?.bannerEvidence
    });

    // ── 2. Cookie Categorization (8 pts) ────────────────────────────────────
    const categorizationFromCookiePage = signals?.hasCategorization === true;
    const categorizationFromProteccio = hasProteccioBanner && website.autoCategorize === true;
    const categorizationPassed = categorizationFromCookiePage || categorizationFromProteccio;

    indicators.push({
      id: 'categorization',
      name: 'Cookie Categorization',
      weight: 8,
      passed: categorizationPassed,
      score: categorizationPassed ? 8 : 0,
      severity: categorizationPassed ? 'LOW' : 'HIGH',
      details: categorizationPassed
        ? categorizationFromCookiePage
          ? 'Cookie policy page lists cookie categories (Necessary, Analytics, Marketing, etc.).'
          : 'Proteccio auto-categorization active — cookies are classified by category.'
        : 'No cookie categorization found. Cookies should be grouped into categories (Necessary, Functional, Analytics, Marketing) so users can make informed choices.',
      evidence: signals?.categorizationEvidence
    });

    // ── 3. Consent Logging (8 pts) ──────────────────────────────────────────
    const consentLoggingFromPolicy = signals?.hasConsentLogging === true;
    const consentLoggingFromProteccio = hasProteccioBanner;
    const consentLoggingPassed = consentLoggingFromPolicy || consentLoggingFromProteccio;

    indicators.push({
      id: 'consent_logging',
      name: 'Consent Logging',
      weight: 8,
      passed: consentLoggingPassed,
      score: consentLoggingPassed ? 8 : 0,
      severity: consentLoggingPassed ? 'LOW' : 'HIGH',
      details: consentLoggingPassed
        ? consentLoggingFromProteccio
          ? 'Proteccio consent management platform logs all user consent records with timestamps and preferences.'
          : 'Consent logging mechanism mentioned in policy pages.'
        : 'No consent logging mechanism detected. GDPR Article 7 requires demonstrable proof that consent was given. Implement server-side consent records.',
      evidence: signals?.consentLoggingEvidence
    });

    // ── 4. Privacy Notice (10 pts) ──────────────────────────────────────────
    indicators.push({
      id: 'privacy_policy',
      name: 'Privacy Notice',
      weight: 10,
      passed: hasPrivacyPolicy,
      score: hasPrivacyPolicy ? 10 : 0,
      severity: hasPrivacyPolicy ? 'LOW' : 'CRITICAL',
      details: hasPrivacyPolicy
        ? 'Privacy Notice page detected on the website.'
        : 'No Privacy Notice page found. A privacy notice is a legal requirement under GDPR (Article 13/14) and DPDP Act (Section 6).',
      evidence: signals?.privacyPolicyEvidence
    });

    // ── 5. Cookie Policy Page (5 pts) — NEW ─────────────────────────────────
    // Separate from Privacy Policy: a dedicated cookie policy/notice page
    const hasCookiePolicyPage = hasCookieNotice || (signals?.hasCookieNotice === true);
    // Also accept if categorization was found on a cookie policy page (implies such page exists)
    const cookiePolicyPassed = hasCookiePolicyPage || categorizationFromCookiePage;

    indicators.push({
      id: 'cookie_policy',
      name: 'Cookie Policy Page',
      weight: 5,
      passed: cookiePolicyPassed,
      score: cookiePolicyPassed ? 5 : 0,
      severity: cookiePolicyPassed ? 'LOW' : 'MEDIUM',
      details: cookiePolicyPassed
        ? 'Dedicated cookie policy/notice page found. Users can learn which cookies are used and why.'
        : 'No dedicated cookie policy page detected. Consider adding a separate cookie notice that lists all cookies used, their purpose, and duration.',
      evidence: signals?.cookiePolicyEvidence
    });

    // ── 6. DSAR Provisions (5 pts) ──────────────────────────────────────────
    const dsarPassed = signals?.hasDsar === true;
    indicators.push({
      id: 'dsar',
      name: 'Data Subject Access Request (DSAR)',
      weight: 5,
      passed: dsarPassed,
      score: dsarPassed ? 5 : 0,
      severity: dsarPassed ? 'LOW' : 'MEDIUM',
      details: dsarPassed
        ? 'DSAR / data subject rights provisions found in privacy or cookie notice. Users are informed of their data rights.'
        : 'No DSAR provisions detected. Add clear information about user data rights (access, rectification, erasure, portability) in your privacy notice.',
      evidence: signals?.dsarEvidence
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY & TECHNICAL INDICATORS (36 pts)
    // ═══════════════════════════════════════════════════════════════════════

    // ── 7. HTTPS Security (8 pts) ───────────────────────────────────────────
    const isHttps = website.url.startsWith('https://');
    indicators.push({
      id: 'https_security',
      name: 'HTTPS Security',
      weight: 8,
      passed: isHttps,
      score: isHttps ? 8 : 0,
      severity: isHttps ? 'LOW' : 'CRITICAL',
      details: isHttps
        ? 'Website uses secure HTTPS connection. Cookie data is encrypted in transit.'
        : 'Website is using insecure HTTP. HTTPS is mandatory for cookie compliance — cookies transmitted over HTTP can be intercepted.',
      evidence: signals?.httpsEvidence
    });

    // ── 8. Secure Flag Audit (8 pts) — GRADUATED ────────────────────────────
    let securePassCount = 0;
    let secureFailCount = 0;
    const insecureCookieNames: string[] = [];

    if (isHttps && httpCookies.length > 0) {
      for (const c of httpCookies) {
        if (c.domain?.includes('localhost')) {
          securePassCount++;
          continue;
        }
        if (c.secure) {
          securePassCount++;
        } else {
          secureFailCount++;
          if (insecureCookieNames.length < 5) insecureCookieNames.push(c.name);
        }
      }
    } else {
      securePassCount = httpCookies.length; // Non-HTTPS or no cookies = pass
    }

    const secureTotal = securePassCount + secureFailCount;
    const secureScore = this.graduatedScore(8, securePassCount, secureTotal);
    const securePassed = secureFailCount === 0;

    indicators.push({
      id: 'secure_flags',
      name: 'Secure Flag Audit',
      weight: 8,
      passed: securePassed,
      score: secureScore,
      severity: this.calculateSeverity(secureFailCount, secureTotal),
      details: securePassed
        ? `All ${secureTotal} HTTP cookie(s) have the Secure flag set.`
        : `${secureFailCount} of ${secureTotal} cookie(s) missing Secure flag${insecureCookieNames.length > 0 ? `: ${insecureCookieNames.join(', ')}${secureFailCount > 5 ? ` (+${secureFailCount - 5} more)` : ''}` : ''}. Cookies without Secure flag can be transmitted over unencrypted connections.`,
      evidence: secureFailCount > 0
        ? { url: website.url, snippet: `Failing cookies: ${insecureCookieNames.join(', ')}` }
        : undefined
    });

    // ── 9. HttpOnly Flag Audit (8 pts) — GRADUATED ──────────────────────────
    let httpOnlyPassCount = 0;
    let httpOnlyFailCount = 0;
    const httpOnlyFailNames: string[] = [];

    if (httpCookies.length > 0) {
      // Check session/auth cookies specifically — these MUST have HttpOnly
      const sessionCookies = httpCookies.filter(c => c.session || /sess|token|auth|login|sid|jwt/i.test(c.name));
      if (sessionCookies.length > 0) {
        for (const c of sessionCookies) {
          if (c.httpOnly) {
            httpOnlyPassCount++;
          } else {
            httpOnlyFailCount++;
            if (httpOnlyFailNames.length < 5) httpOnlyFailNames.push(c.name);
          }
        }
      } else {
        // No session cookies found — pass by default
        httpOnlyPassCount = 1;
      }
    }

    const httpOnlyTotal = httpOnlyPassCount + httpOnlyFailCount;
    const httpOnlyScore = this.graduatedScore(8, httpOnlyPassCount, httpOnlyTotal);
    const httpOnlyPassed = httpOnlyFailCount === 0;

    indicators.push({
      id: 'httponly_flags',
      name: 'HttpOnly Flag Audit',
      weight: 8,
      passed: httpOnlyPassed,
      score: httpOnlyScore,
      severity: this.calculateSeverity(httpOnlyFailCount, httpOnlyTotal),
      details: httpOnlyPassed
        ? httpOnlyTotal > 0
          ? `All ${httpOnlyTotal} session/auth cookie(s) properly use HttpOnly flags, preventing XSS attacks.`
          : 'No session cookies detected — HttpOnly audit passed by default.'
        : `${httpOnlyFailCount} of ${httpOnlyTotal} session cookie(s) missing HttpOnly flag${httpOnlyFailNames.length > 0 ? `: ${httpOnlyFailNames.join(', ')}` : ''}. These cookies are vulnerable to JavaScript-based attacks (XSS).`,
      evidence: httpOnlyFailCount > 0
        ? { url: website.url, snippet: `Failing session cookies: ${httpOnlyFailNames.join(', ')}` }
        : undefined
    });

    // ── 10. Cookie Expiry Audit (7 pts) — GRADUATED ─────────────────────────
    let expiryPassCount = 0;
    let expiryFailCount = 0;
    const longLivedNames: string[] = [];

    if (httpCookies.length > 0) {
      const oneYearFromNow = Date.now() / 1000 + (365 * 24 * 60 * 60);
      for (const c of httpCookies) {
        if (c.expires && c.expires > oneYearFromNow) {
          expiryFailCount++;
          if (longLivedNames.length < 5) longLivedNames.push(c.name);
        } else {
          expiryPassCount++;
        }
      }
    }

    const expiryTotal = expiryPassCount + expiryFailCount;
    const expiryScore = this.graduatedScore(7, expiryPassCount, expiryTotal);
    const expiryPassed = expiryFailCount === 0;

    indicators.push({
      id: 'cookie_expiry',
      name: 'Cookie Expiry Audit',
      weight: 7,
      passed: expiryPassed,
      score: expiryScore,
      severity: this.calculateSeverity(expiryFailCount, expiryTotal),
      details: expiryPassed
        ? expiryTotal > 0
          ? `All ${expiryTotal} cookie(s) expire within 1 year (GDPR recommended maximum).`
          : 'No persistent cookies detected — expiry audit passed.'
        : `${expiryFailCount} of ${expiryTotal} cookie(s) exceed the 1-year GDPR recommended maximum${longLivedNames.length > 0 ? `: ${longLivedNames.join(', ')}` : ''}. Long-lived cookies increase privacy risk and may violate data minimization principles.`,
      evidence: expiryFailCount > 0
        ? { url: website.url, snippet: `Long-lived cookies: ${longLivedNames.join(', ')}` }
        : undefined
    });

    // ── 11. SameSite Attribute Check (5 pts) — NEW, GRADUATED ───────────────
    let sameSitePassCount = 0;
    let sameSiteFailCount = 0;
    const sameSiteFailNames: string[] = [];

    if (httpCookies.length > 0) {
      for (const c of httpCookies) {
        // sameSite can be 'Strict', 'Lax', or 'None' — 'None' without Secure is bad
        const sameSite = (c.sameSite || '').toString().toLowerCase();
        if (sameSite === 'strict' || sameSite === 'lax') {
          sameSitePassCount++;
        } else if (sameSite === 'none' && c.secure) {
          // SameSite=None + Secure is acceptable (needed for cross-site)
          sameSitePassCount++;
        } else {
          sameSiteFailCount++;
          if (sameSiteFailNames.length < 5) sameSiteFailNames.push(c.name);
        }
      }
    }

    const sameSiteTotal = sameSitePassCount + sameSiteFailCount;
    const sameSiteScore = this.graduatedScore(5, sameSitePassCount, sameSiteTotal);
    const sameSitePassed = sameSiteFailCount === 0;

    indicators.push({
      id: 'samesite_attribute',
      name: 'SameSite Attribute',
      weight: 5,
      passed: sameSitePassed,
      score: sameSiteScore,
      severity: this.calculateSeverity(sameSiteFailCount, sameSiteTotal),
      details: sameSitePassed
        ? sameSiteTotal > 0
          ? `All ${sameSiteTotal} cookie(s) have proper SameSite attributes (Strict/Lax), providing CSRF protection.`
          : 'No HTTP cookies detected — SameSite audit passed.'
        : `${sameSiteFailCount} of ${sameSiteTotal} cookie(s) missing proper SameSite attribute${sameSiteFailNames.length > 0 ? `: ${sameSiteFailNames.join(', ')}` : ''}. Without SameSite, cookies are sent with all cross-site requests, enabling CSRF attacks.`,
      evidence: sameSiteFailCount > 0
        ? { url: website.url, snippet: `Cookies without SameSite: ${sameSiteFailNames.join(', ')}` }
        : undefined
    });

    // ═══════════════════════════════════════════════════════════════════════
    // DISCLOSURE & USER RIGHTS INDICATORS (18 pts)
    // ═══════════════════════════════════════════════════════════════════════

    // ── 12. Third-Party Disclosure (5 pts) ──────────────────────────────────
    const hasThirdPartyScripts = thirdPartyScripts.length > 0;
    const thirdPartyDisclosedInPolicy = signals?.hasThirdPartyDisclosure === true;
    const thirdPartyPassed = !hasThirdPartyScripts || thirdPartyDisclosedInPolicy;

    indicators.push({
      id: 'third_party_disclosure',
      name: 'Third-party Disclosure',
      weight: 5,
      passed: thirdPartyPassed,
      score: thirdPartyPassed ? 5 : 0,
      severity: thirdPartyPassed ? 'LOW' : 'HIGH',
      details: thirdPartyPassed
        ? hasThirdPartyScripts
          ? `Third-party disclosures found in policy. ${thirdPartyScripts.length} third-party domain(s) detected and properly disclosed.`
          : 'No third-party scripts detected — disclosure not required.'
        : `${thirdPartyScripts.length} third-party domain(s) detected but not disclosed in privacy or cookie policy. Under GDPR and DPDP, all data sharing with third parties must be transparently communicated.`,
      evidence: signals?.thirdPartyEvidence
    });

    // ── 13. Opt-out Mechanism (5 pts) ───────────────────────────────────────
    const optOutFromBanner = hasBanner;
    const optOutFromPolicy = signals?.hasOptOut === true;
    const optOutPassed = optOutFromBanner || optOutFromPolicy;

    indicators.push({
      id: 'opt_out',
      name: 'Opt-out Mechanism',
      weight: 5,
      passed: optOutPassed,
      score: optOutPassed ? 5 : 0,
      severity: optOutPassed ? 'LOW' : 'HIGH',
      details: optOutPassed
        ? optOutFromBanner
          ? `Opt-out available via ${cmpProvider || 'cookie'} banner consent controls. Users can withdraw consent at any time.`
          : 'Opt-out / withdrawal mechanism mentioned in privacy or cookie policy.'
        : 'No opt-out mechanism detected. GDPR Article 7(3) requires that withdrawing consent must be as easy as giving it.',
      evidence: signals?.optOutEvidence
    });

    // ── 14. Language Localization (3 pts) ────────────────────────────────────
    const localizationPassed = signals?.hasLocalization === true;

    indicators.push({
      id: 'language_support',
      name: 'Language Localization',
      weight: 3,
      passed: localizationPassed,
      score: localizationPassed ? 3 : 0,
      severity: localizationPassed ? 'LOW' : 'LOW',
      details: localizationPassed
        ? signals?.hasLocalization
          ? `Language localization detected (${signals?.languageEvidence?.snippet || 'non-English content found'}). Privacy information is accessible to a broader audience.`
          : 'Default language (English) is appropriate for the audience.'
        : 'No language localization signals found. Consider providing privacy information in local languages for better accessibility.',
      evidence: signals?.languageEvidence
    });

    // ── 15. Grievance Mechanism (5 pts) ─────────────────────────────────────
    const grievancePassed = signals?.hasGrievance === true;
    indicators.push({
      id: 'grievance_mechanism',
      name: 'Grievance Mechanism',
      weight: 5,
      passed: grievancePassed,
      score: grievancePassed ? 5 : 0,
      severity: grievancePassed ? 'LOW' : 'MEDIUM',
      details: grievancePassed
        ? 'Grievance redressal mechanism / nodal officer contact found. Users can escalate data privacy concerns.'
        : 'No grievance mechanism detected. Required under India DPDP Act Section 8 — add a grievance officer with contact details in your privacy notice.',
      evidence: signals?.grievanceEvidence
    });

    return indicators;
  }

  private calculateRisk(score: number): string {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }
}
