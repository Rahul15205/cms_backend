import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScannedWebsite, CookieBanner } from '@prisma/client';

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
      
      let totalScore = 0;
      indicators.forEach(i => totalScore += i.score);
      
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

      this.logger.log(`Compliance Evaluation for ${website.url}: Score ${totalScore}%`);

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
    
    const hasBanner = website.cookieBanners && website.cookieBanners.length > 0;
    const hasCookieNotice = signals?.hasCookieNotice || crawledLinks.some(l => /cookie(-)?policy|cookie(-)?notice/i.test(l));
    const hasPrivacyPolicy = signals?.hasPrivacyPolicy || crawledLinks.some(l => /privacy(-)?policy|privacy/i.test(l));
    const hasComplianceNotice = signals?.hasComplianceNotice || crawledLinks.some(l => /compliance|legal/i.test(l));

    // 1. Banner Installed (5 pts)
    indicators.push({
      id: 'banner_installed',
      name: 'Cookie Banner Installed',
      weight: 5,
      passed: hasBanner,
      score: hasBanner ? 5 : 0,
      details: hasBanner ? 'A Proteccio consent banner is detected on the website.' : 'No cookie consent banner detected.'
    });

    // 2. Cookie Categorization (10 pts)
    const categorizationPassed = (hasBanner && website.autoCategorize) || (hasCookieNotice && signals?.hasCategorization);
    indicators.push({
      id: 'categorization',
      name: 'Cookie Categorization',
      weight: 10,
      passed: categorizationPassed,
      score: categorizationPassed ? 10 : 0,
      details: categorizationPassed ? 'Cookies are categorized (Necessary, Analytics, etc.).' : 'Automatic categorization not active or detected.',
      evidence: signals?.categorizationEvidence
    });

    // 3. Consent Logging (10 pts)
    indicators.push({
      id: 'consent_logging',
      name: 'Consent Logging',
      weight: 10,
      passed: hasBanner,
      score: hasBanner ? 10 : 0,
      details: hasBanner ? 'Consent logging mechanism is active via the banner.' : 'Consent logging not detected.'
    });

    // 4. Privacy Policy (10 pts)
    indicators.push({
      id: 'privacy_policy',
      name: 'Privacy Notice',
      weight: 10,
      passed: hasPrivacyPolicy,
      score: hasPrivacyPolicy ? 10 : 0,
      details: hasPrivacyPolicy ? 'Privacy Notice is available on the website.' : 'Privacy Notice link not found.'
    });

    // 5. DSAR (5 pts)
    const dsarPassed = signals?.hasDsar;
    indicators.push({
      id: 'dsar',
      name: 'Data Subject Access Request (DSAR)',
      weight: 5,
      passed: dsarPassed,
      score: dsarPassed ? 5 : 0,
      details: dsarPassed ? 'DSAR provisions found in privacy or cookie notice.' : 'No DSAR provisions detected.',
      evidence: signals?.dsarEvidence
    });

    // 6. HTTPS Security (10 pts)
    const isHttps = website.url.startsWith('https://');
    indicators.push({
      id: 'https_security',
      name: 'HTTPS Security',
      weight: 10,
      passed: isHttps,
      score: isHttps ? 10 : 0,
      details: isHttps ? 'Website uses secure HTTPS connection.' : 'Website is using insecure HTTP connection.'
    });

    // 7. Third-party Disclosure (5 pts)
    const hasThirdParty = thirdPartyScripts.length > 0;
    const thirdPartyPassed = signals?.hasThirdPartyDisclosure || (hasThirdParty && hasBanner);
    indicators.push({
      id: 'third_party_disclosure',
      name: 'Third-party Disclosure',
      weight: 5,
      passed: thirdPartyPassed,
      score: thirdPartyPassed ? 5 : 0,
      details: thirdPartyPassed ? 'Third-party disclosures are present.' : 'Missing third-party disclosures.',
      evidence: signals?.thirdPartyEvidence
    });

    // 8. Opt-out Mechanism (5 pts)
    const optOutPassed = (hasBanner && website.cookieBanners.length > 0) || signals?.hasOptOut;
    indicators.push({
      id: 'opt_out',
      name: 'Opt-out Mechanism',
      weight: 5,
      passed: optOutPassed,
      score: optOutPassed ? 5 : 0,
      details: optOutPassed ? 'Opt-out or withdrawal mechanism is available.' : 'No clear opt-out mechanism detected.',
      evidence: signals?.optOutEvidence
    });

    // 9. Language Localization (5 pts)
    const localizationPassed = signals?.hasLocalization || hasBanner;
    indicators.push({
      id: 'language_support',
      name: 'Language Localization',
      weight: 5,
      passed: localizationPassed,
      score: localizationPassed ? 5 : 0,
      details: localizationPassed ? 'Website support multiple languages or localization.' : 'No language localization signals found.'
    });

    // 10. Grievance Mechanism (5 pts)
    const grievancePassed = signals?.hasGrievance;
    indicators.push({
      id: 'grievance_mechanism',
      name: 'Grievance Mechanism',
      weight: 5,
      passed: grievancePassed,
      score: grievancePassed ? 5 : 0,
      details: grievancePassed ? 'Grievance redressal mechanism found.' : 'No grievance mechanism detected.',
      evidence: signals?.grievanceEvidence
    });

    // Phase 5 Enhanced Checks: 30 Points total

    const httpCookies = (discoveredCookies || []).filter(c => c.type === 'HTTP_COOKIE');

    // 11. Secure Flag Audit (10 pts)
    let securePassed = true;
    if (isHttps && httpCookies.length > 0) {
      // Check if all non-localhost HTTP cookies have the Secure flag
      securePassed = httpCookies.every(c => c.secure || c.domain?.includes('localhost'));
    }
    indicators.push({
      id: 'secure_flags',
      name: 'Secure Flag Audit',
      weight: 10,
      passed: securePassed,
      score: securePassed ? 10 : 0,
      details: securePassed ? 'All detected cookies have Secure flags.' : 'Some cookies are missing the Secure flag over HTTPS.'
    });

    // 12. HttpOnly Flag Audit (10 pts)
    let httpOnlyPassed = true;
    if (httpCookies.length > 0) {
      // Functional/Session cookies should have HttpOnly
      const sessionCookies = httpCookies.filter(c => c.session || /sess/i.test(c.name));
      if (sessionCookies.length > 0) {
         httpOnlyPassed = sessionCookies.every(c => c.httpOnly);
      }
    }
    indicators.push({
      id: 'httponly_flags',
      name: 'HttpOnly Flag Audit',
      weight: 10,
      passed: httpOnlyPassed,
      score: httpOnlyPassed ? 10 : 0,
      details: httpOnlyPassed ? 'Session cookies properly use HttpOnly flags.' : 'Some session cookies are missing HttpOnly flags.'
    });

    // 13. Expiry Audit (10 pts)
    let expiryPassed = true;
    if (httpCookies.length > 0) {
      const oneYearFromNow = Date.now() / 1000 + (365 * 24 * 60 * 60);
      expiryPassed = !httpCookies.some(c => c.expires && c.expires > oneYearFromNow);
    }
    indicators.push({
      id: 'cookie_expiry',
      name: 'Cookie Expiry Audit',
      weight: 10,
      passed: expiryPassed,
      score: expiryPassed ? 10 : 0,
      details: expiryPassed ? 'All cookies expire within 1 year (GDPR recommended).' : 'Found cookies with expiration exceeding 1 year.'
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
