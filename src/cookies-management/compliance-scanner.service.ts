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
    signals?: any
  ): Promise<void> {
    try {
      const website = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        include: { cookieBanners: true }
      });

      if (!website) return;

      const indicators = this.runHeuristics(website, crawledLinks, thirdPartyScripts, signals);
      
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
    signals?: any
  ): ComplianceIndicator[] {
    const indicators: ComplianceIndicator[] = [];
    
    const hasBanner = website.cookieBanners && website.cookieBanners.length > 0;
    const hasCookieNotice = signals?.hasCookieNotice || crawledLinks.some(l => /cookie(-)?policy|cookie(-)?notice/i.test(l));
    const hasPrivacyPolicy = signals?.hasPrivacyPolicy || crawledLinks.some(l => /privacy(-)?policy|privacy/i.test(l));
    const hasComplianceNotice = signals?.hasComplianceNotice || crawledLinks.some(l => /compliance|legal/i.test(l));

    // 1. Banner Installed (8 pts) - User requested weight 8
    indicators.push({
      id: 'banner_installed',
      name: 'Cookie Banner Installed',
      weight: 8,
      passed: hasBanner,
      score: hasBanner ? 8 : 0,
      details: hasBanner ? 'A Proteccio consent banner is detected on the website.' : 'No cookie consent banner detected.'
    });

    // 2. Cookie Categorization (12 pts) - Check Cookie Banner & Cookie Notice
    const categorizationPassed = (hasBanner && website.autoCategorize) || (hasCookieNotice && signals?.hasCategorization);
    indicators.push({
      id: 'cookie_categorization',
      name: 'Cookie Categorization',
      weight: 12,
      passed: categorizationPassed,
      score: categorizationPassed ? 12 : 0,
      details: categorizationPassed ? 'Cookies are categorized in the banner or notice.' : 'Cookie categorization not clearly defined.'
    });

    // 3. Consent Logging (15 pts) - Check Cookie Banner
    indicators.push({
      id: 'consent_logging',
      name: 'Consent Logging',
      weight: 15,
      passed: hasBanner,
      score: hasBanner ? 15 : 0,
      details: hasBanner ? 'Consent logging mechanism is active via the banner.' : 'Consent logging not detected.'
    });

    // 4. Privacy Policy (12 pts) - Whole website
    indicators.push({
      id: 'privacy_policy',
      name: 'Privacy Notice',
      weight: 12,
      passed: hasPrivacyPolicy,
      score: hasPrivacyPolicy ? 12 : 0,
      details: hasPrivacyPolicy ? 'Privacy Notice is available on the website.' : 'Privacy Notice link not found.'
    });

    // 5. DSAR (8 pts) - Check Privacy Notice & Cookie Notice
    const dsarPassed = signals?.hasDsar;
    indicators.push({
      id: 'dsar',
      name: 'Data Subject Access Request (DSAR)',
      weight: 8,
      passed: dsarPassed,
      score: dsarPassed ? 8 : 0,
      details: dsarPassed ? 'DSAR provisions found in privacy or cookie notice.' : 'No DSAR provisions detected.'
    });

    // 6. HTTPS Security (10 pts) - Whole website
    const isHttps = website.url.startsWith('https://');
    indicators.push({
      id: 'https_security',
      name: 'HTTPS Security',
      weight: 10,
      passed: isHttps,
      score: isHttps ? 10 : 0,
      details: isHttps ? 'Website uses secure HTTPS connection.' : 'Website is using insecure HTTP connection.'
    });

    // 7. Third-party Disclosure (8 pts) - Banner, Cookie Notice, Privacy Notice
    const hasThirdParty = thirdPartyScripts.length > 0;
    const thirdPartyPassed = signals?.hasThirdPartyDisclosure || (hasThirdParty && hasBanner);
    indicators.push({
      id: 'third_party_disclosure',
      name: 'Third-party Disclosure',
      weight: 8,
      passed: thirdPartyPassed,
      score: thirdPartyPassed ? 8 : 0,
      details: thirdPartyPassed ? 'Third-party disclosures are present.' : 'Missing third-party disclosures.'
    });

    // 8. Opt-out Mechanism (7 pts) - Privacy Notice, Banner, Cookie Notice
    const optOutPassed = signals?.hasOptOut || hasBanner;
    indicators.push({
      id: 'opt_out_mechanism',
      name: 'Opt-out Mechanism',
      weight: 7,
      passed: optOutPassed,
      score: optOutPassed ? 7 : 0,
      details: optOutPassed ? 'Opt-out or withdrawal mechanism is available.' : 'No opt-out mechanism found.'
    });

    // 9. Language Localization (8 pts) - Whole website
    const localizationPassed = signals?.hasLocalization || hasBanner;
    indicators.push({
      id: 'language_support',
      name: 'Language Localization',
      weight: 8,
      passed: localizationPassed,
      score: localizationPassed ? 8 : 0,
      details: localizationPassed ? 'Website support multiple languages or localization.' : 'No language localization signals found.'
    });

    // 10. Grievance Mechanism (12 pts) - Privacy Notice, Compliance Notice
    const grievancePassed = signals?.hasGrievance;
    indicators.push({
      id: 'grievance_mechanism',
      name: 'Grievance Mechanism',
      weight: 12,
      passed: grievancePassed,
      score: grievancePassed ? 12 : 0,
      details: grievancePassed ? 'Grievance redressal mechanism found.' : 'No grievance mechanism detected.'
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
