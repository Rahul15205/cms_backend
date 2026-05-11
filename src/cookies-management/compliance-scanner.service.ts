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

      const totalScore = indicators.reduce((sum, i) => sum + i.score, 0);
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

      this.logger.log(`Compliance for ${website.url}: ${totalScore}% | Risk: ${riskLevel} | CMP: ${signals?.cmpProvider || 'none'}`);
    } catch (error) {
      this.logger.error(`Error evaluating compliance: ${error.message}`);
    }
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

    // ── 1. Cookie Banner Installed (5 pts) ──────────────────────────────────
    indicators.push({
      id: 'banner_installed',
      name: 'Cookie Banner Installed',
      weight: 5,
      passed: hasBanner,
      score: hasBanner ? 5 : 0,
      details: hasBanner
        ? `Cookie consent banner detected${cmpProvider ? ` (${cmpProvider})` : ''}.`
        : 'No cookie consent banner detected on any page.',
      evidence: signals?.bannerEvidence
    });

    // ── 2. Cookie Categorization (10 pts) ───────────────────────────────────
    const categorizationFromCookiePage = signals?.hasCategorization === true;
    const categorizationFromProteccio = hasProteccioBanner && website.autoCategorize === true;
    const categorizationPassed = categorizationFromCookiePage || categorizationFromProteccio;

    indicators.push({
      id: 'categorization',
      name: 'Cookie Categorization',
      weight: 10,
      passed: categorizationPassed,
      score: categorizationPassed ? 10 : 0,
      details: categorizationPassed
        ? categorizationFromCookiePage
          ? 'Cookie policy page lists cookie categories (Necessary, Analytics, Marketing, etc.).'
          : 'Proteccio auto-categorization active — cookies are classified by category.'
        : 'No cookie categorization found in cookie policy or banner.',
      evidence: signals?.categorizationEvidence
    });

    // ── 3. Consent Logging (10 pts) ─────────────────────────────────────────
    const consentLoggingFromPolicy = signals?.hasConsentLogging === true;
    const consentLoggingFromProteccio = hasProteccioBanner;
    const consentLoggingPassed = consentLoggingFromPolicy || consentLoggingFromProteccio;

    indicators.push({
      id: 'consent_logging',
      name: 'Consent Logging',
      weight: 10,
      passed: consentLoggingPassed,
      score: consentLoggingPassed ? 10 : 0,
      details: consentLoggingPassed
        ? consentLoggingFromProteccio
          ? 'Proteccio consent management platform logs all user consent records.'
          : 'Consent logging mechanism mentioned in policy pages.'
        : 'No consent logging mechanism detected. Implement server-side consent records.',
      evidence: signals?.consentLoggingEvidence
    });

    // ── 4. Privacy Notice (10 pts) ──────────────────────────────────────────
    indicators.push({
      id: 'privacy_policy',
      name: 'Privacy Notice',
      weight: 10,
      passed: hasPrivacyPolicy,
      score: hasPrivacyPolicy ? 10 : 0,
      details: hasPrivacyPolicy
        ? 'Privacy Notice page detected on the website.'
        : 'No Privacy Notice page found. A privacy notice is required under DPDP and GDPR.',
      evidence: signals?.privacyPolicyEvidence
    });

    // ── 5. DSAR Provisions (5 pts) ──────────────────────────────────────────
    const dsarPassed = signals?.hasDsar === true;
    indicators.push({
      id: 'dsar',
      name: 'Data Subject Access Request (DSAR)',
      weight: 5,
      passed: dsarPassed,
      score: dsarPassed ? 5 : 0,
      details: dsarPassed
        ? 'DSAR / data subject rights provisions found in privacy or cookie notice.'
        : 'No DSAR provisions detected. Add information about user data rights in your privacy notice.',
      evidence: signals?.dsarEvidence
    });

    // ── 6. HTTPS Security (10 pts) ──────────────────────────────────────────
    const isHttps = website.url.startsWith('https://');
    indicators.push({
      id: 'https_security',
      name: 'HTTPS Security',
      weight: 10,
      passed: isHttps,
      score: isHttps ? 10 : 0,
      details: isHttps
        ? 'Website uses secure HTTPS connection.'
        : 'Website is using insecure HTTP. HTTPS is mandatory for cookie compliance.',
      evidence: signals?.httpsEvidence
    });

    // ── 7. Third-Party Disclosure (5 pts) ───────────────────────────────────
    const hasThirdPartyScripts = thirdPartyScripts.length > 0;
    const thirdPartyDisclosedInPolicy = signals?.hasThirdPartyDisclosure === true;
    const thirdPartyPassed = !hasThirdPartyScripts || thirdPartyDisclosedInPolicy;

    indicators.push({
      id: 'third_party_disclosure',
      name: 'Third-party Disclosure',
      weight: 5,
      passed: thirdPartyPassed,
      score: thirdPartyPassed ? 5 : 0,
      details: thirdPartyPassed
        ? hasThirdPartyScripts
          ? `Third-party disclosures found in policy (${thirdPartyScripts.length} third-party domain(s) detected).`
          : 'No third-party scripts detected — disclosure not required.'
        : `${thirdPartyScripts.length} third-party domain(s) detected but not disclosed in privacy or cookie policy.`,
      evidence: signals?.thirdPartyEvidence
    });

    // ── 8. Opt-out Mechanism (5 pts) ────────────────────────────────────────
    const optOutFromBanner = hasBanner;
    const optOutFromPolicy = signals?.hasOptOut === true;
    const optOutPassed = optOutFromBanner || optOutFromPolicy;

    indicators.push({
      id: 'opt_out',
      name: 'Opt-out Mechanism',
      weight: 5,
      passed: optOutPassed,
      score: optOutPassed ? 5 : 0,
      details: optOutPassed
        ? optOutFromBanner
          ? `Opt-out available via ${cmpProvider || 'cookie'} banner consent controls.`
          : 'Opt-out / withdrawal mechanism mentioned in privacy or cookie policy.'
        : 'No opt-out mechanism detected. Add consent withdrawal option in banner or policy.',
      evidence: signals?.optOutEvidence
    });

    // ── 9. Language Localization (5 pts) ────────────────────────────────────
    const localizationPassed = signals?.hasLocalization === true;

    indicators.push({
      id: 'language_support',
      name: 'Language Localization',
      weight: 5,
      passed: localizationPassed,
      score: localizationPassed ? 5 : 0,
      details: localizationPassed
        ? signals?.hasLocalization
          ? `Language localization detected (${signals?.languageEvidence?.snippet || 'non-English content found'}).`
          : 'Default language (English) is appropriate for the audience.'
        : 'No language localization signals found.',
      evidence: signals?.languageEvidence
    });

    // ── 10. Grievance Mechanism (5 pts) ─────────────────────────────────────
    const grievancePassed = signals?.hasGrievance === true;
    indicators.push({
      id: 'grievance_mechanism',
      name: 'Grievance Mechanism',
      weight: 5,
      passed: grievancePassed,
      score: grievancePassed ? 5 : 0,
      details: grievancePassed
        ? 'Grievance redressal mechanism / nodal officer contact found.'
        : 'No grievance mechanism detected. Required under India DPDP Act — add grievance officer details.',
      evidence: signals?.grievanceEvidence
    });

    // ── Phase 5: Cookie Technical Audit (30 pts) ────────────────────────────

    // ── 11. Secure Flag Audit (10 pts) ──────────────────────────────────────
    let securePassed = true;
    let secureFailCount = 0;
    if (isHttps && httpCookies.length > 0) {
      const insecureCookies = httpCookies.filter(c =>
        !c.secure && !c.domain?.includes('localhost')
      );
      secureFailCount = insecureCookies.length;
      securePassed = secureFailCount === 0;
    }

    indicators.push({
      id: 'secure_flags',
      name: 'Secure Flag Audit',
      weight: 10,
      passed: securePassed,
      score: securePassed ? 10 : 0,
      details: securePassed
        ? 'All detected cookies have Secure flags.'
        : 'Some cookies are missing the Secure flag over HTTPS.',
      evidence: signals?.secureFlagEvidence ? { url: website.url, snippet: `Example cookie: ${signals.secureFlagEvidence.cookieName}` } : undefined
    });

    // ── 12. HttpOnly Flag Audit (10 pts) ────────────────────────────────────
    let httpOnlyPassed = true;
    let httpOnlyFailCount = 0;
    if (httpCookies.length > 0) {
      const sessionCookies = httpCookies.filter(c => c.session || /sess|token|auth/i.test(c.name));
      if (sessionCookies.length > 0) {
        const httpOnlyFails = sessionCookies.filter(c => !c.httpOnly);
        httpOnlyFailCount = httpOnlyFails.length;
        httpOnlyPassed = httpOnlyFailCount === 0;
      }
    }

    indicators.push({
      id: 'httponly_flags',
      name: 'HttpOnly Flag Audit',
      weight: 10,
      passed: httpOnlyPassed,
      score: httpOnlyPassed ? 10 : 0,
      details: httpOnlyPassed
        ? 'Session cookies properly use HttpOnly flags.'
        : 'Some session cookies are missing HttpOnly flags.',
      evidence: signals?.httpOnlyFlagEvidence ? { url: website.url, snippet: `Example cookie: ${signals.httpOnlyFlagEvidence.cookieName}` } : undefined
    });

    // ── 13. Cookie Expiry Audit (10 pts) ────────────────────────────────────
    let expiryPassed = true;
    let longLivedCount = 0;
    if (httpCookies.length > 0) {
      const oneYearFromNow = Date.now() / 1000 + (365 * 24 * 60 * 60);
      const longLived = httpCookies.filter(c => c.expires && c.expires > oneYearFromNow);
      longLivedCount = longLived.length;
      expiryPassed = longLivedCount === 0;
    }

    indicators.push({
      id: 'cookie_expiry',
      name: 'Cookie Expiry Audit',
      weight: 10,
      passed: expiryPassed,
      score: expiryPassed ? 10 : 0,
      details: expiryPassed
        ? 'All cookies expire within 1 year (GDPR recommended).'
        : 'Found cookies with expiration exceeding 1 year.',
      evidence: signals?.expiryFlagEvidence ? { url: website.url, snippet: `Example cookie: ${signals.expiryFlagEvidence.cookieName}` } : undefined
    });

    return indicators;
  }

  private calculateRisk(score: number): string {
    if (score >= 80) return 'LOW';
    if (score >= 50) return 'MEDIUM';
    return 'HIGH';
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
