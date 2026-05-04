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
    thirdPartyScripts: string[]
  ): Promise<void> {
    try {
      const website = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        include: { cookieBanners: true }
      });

      if (!website) return;

      const indicators = this.runHeuristics(website, crawledLinks, thirdPartyScripts);
      
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

  private runHeuristics(website: ScannedWebsite & { cookieBanners: CookieBanner[] }, crawledLinks: string[], thirdPartyScripts: string[]): ComplianceIndicator[] {
    const indicators: ComplianceIndicator[] = [];
    
    const urlString = crawledLinks.join(' ').toLowerCase();

    // 1. Banner Installed (10 pts)
    const hasBanner = website.cookieBanners && website.cookieBanners.length > 0;
    indicators.push({
      id: 'banner_installed',
      name: 'Cookie Banner Installed',
      weight: 10,
      passed: hasBanner,
      score: hasBanner ? 10 : 0,
      details: hasBanner ? 'A Proteccio consent banner is configured for this website.' : 'No cookie consent banner detected.'
    });

    // 2. Cookie Categorization (10 pts)
    indicators.push({
      id: 'cookie_categorization',
      name: 'Cookie Categorization',
      weight: 10,
      passed: website.autoCategorize,
      score: website.autoCategorize ? 10 : 0,
      details: website.autoCategorize ? 'Automatic categorization is enabled.' : 'Cookies are not automatically categorized.'
    });

    // 3. Consent Logging (15 pts)
    indicators.push({
      id: 'consent_logging',
      name: 'Consent Logging',
      weight: 15,
      passed: hasBanner, // Assuming if our banner is installed, we log consents
      score: hasBanner ? 15 : 0,
      details: hasBanner ? 'Consent logs are securely captured.' : 'Cannot verify consent logging mechanism.'
    });

    // 4. Privacy Policy (15 pts)
    const hasPrivacyPolicy = /privacy(-)?policy|privacy|legal/i.test(urlString);
    indicators.push({
      id: 'privacy_policy',
      name: 'Privacy Policy Available',
      weight: 15,
      passed: hasPrivacyPolicy,
      score: hasPrivacyPolicy ? 15 : 0,
      details: hasPrivacyPolicy ? 'Privacy Policy link detected on the website.' : 'Could not find a clear link to a Privacy Policy.'
    });

    // 5. Data Access Request (DSAR) (10 pts)
    const hasDsar = /dsar|data(-)?subject|data(-)?request/i.test(urlString) || hasPrivacyPolicy;
    indicators.push({
      id: 'dsar',
      name: 'Data Subject Access Request (DSAR)',
      weight: 10,
      passed: hasDsar,
      score: hasDsar ? 10 : 0,
      details: hasDsar ? 'Provisions for DSAR detected.' : 'No clear DSAR process found.'
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

    // 7. Third-party Disclosure (10 pts)
    // If third party scripts are found, we check if they have a banner that discloses it.
    const hasThirdParty = thirdPartyScripts.length > 0;
    const thirdPartyPassed = !hasThirdParty || (hasThirdParty && hasBanner);
    indicators.push({
      id: 'third_party_disclosure',
      name: 'Third-party Disclosure',
      weight: 10,
      passed: thirdPartyPassed,
      score: thirdPartyPassed ? 10 : (hasThirdParty ? 5 : 10),
      details: thirdPartyPassed ? 'Third-party scripts are disclosed.' : 'Third-party scripts detected but no banner to disclose them.'
    });

    // 8. Opt-out Mechanism (10 pts)
    indicators.push({
      id: 'opt_out_mechanism',
      name: 'Opt-out Mechanism',
      weight: 10,
      passed: hasBanner,
      score: hasBanner ? 10 : 0,
      details: hasBanner ? 'Opt-out mechanism provided via banner.' : 'No clear opt-out mechanism detected.'
    });

    // 9. Language Support (5 pts)
    // We assume english by default, if banner is there we give points.
    indicators.push({
      id: 'language_support',
      name: 'Language Localization',
      weight: 5,
      passed: hasBanner,
      score: hasBanner ? 5 : 0,
      details: hasBanner ? 'Banner supports localization.' : 'No localization support detected.'
    });

    // 10. Grievance Mechanism (5 pts)
    const hasContact = /contact|support|help|grievance/i.test(urlString);
    indicators.push({
      id: 'grievance_mechanism',
      name: 'Grievance Mechanism',
      weight: 5,
      passed: hasContact,
      score: hasContact ? 5 : 0,
      details: hasContact ? 'Contact or support link detected.' : 'No grievance contact information found.'
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
