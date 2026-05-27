import { BadRequestException, Injectable } from '@nestjs/common';

export interface ParentalConsentContext {
  active: boolean;
  consentGivenBy: 'SELF' | 'GUARDIAN';
  needsGuardianOtp: boolean;
  guardianEmail?: string;
  recordEmail?: string;
  recordPhone?: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class ConsentParentalService {
  isMinorBelowThreshold(template: any, minorAge?: number | null): boolean {
    if (!this.isParentalFlow(template)) return false;
    const age = Number(minorAge);
    if (Number.isNaN(age) || age < 0) return false;
    const threshold = Number(template?.ageThreshold ?? template?.wizardFields?.ageThreshold ?? 18);
    return age < threshold;
  }

  isParentalFlow(template: any): boolean {
    if ((template?.type || '').toString().toUpperCase() === 'PARENTAL') {
      return true;
    }
    const categories =
      template?.targetUserCategory || template?.wizardFields?.targetUserCategory || [];
    return categories.some((c: string) => c.toString().toUpperCase() === 'MINOR');
  }

  resolveContext(template: any, dto: any): ParentalConsentContext {
    if (!this.isParentalFlow(template)) {
      return {
        active: false,
        consentGivenBy: 'SELF',
        needsGuardianOtp: false,
        recordEmail: dto.email,
        recordPhone: dto.phone,
        metadata: {},
      };
    }

    const threshold = Number(template?.ageThreshold ?? template?.wizardFields?.ageThreshold ?? 18);
    const minorAge = Number(dto.minorAge);

    if (Number.isNaN(minorAge) || minorAge < 0 || minorAge > 120) {
      throw new BadRequestException('A valid age is required for this consent form.');
    }

    const baseMeta: Record<string, unknown> = {
      parentalConsent: true,
      minorAge,
      ageThreshold: threshold,
    };

    if (minorAge >= threshold) {
      return {
        active: true,
        consentGivenBy: 'SELF',
        needsGuardianOtp: false,
        recordEmail: dto.email,
        recordPhone: dto.phone,
        metadata: {
          ...baseMeta,
          belowThreshold: false,
          consentGivenBy: 'SELF',
          minor: { age: minorAge, name: dto.name || null },
        },
      };
    }

    const guardianName = dto.guardianName?.trim();
    const guardianEmail = dto.guardianEmail?.trim().toLowerCase();
    const guardianRelationship = dto.guardianRelationship?.trim();

    if (!guardianName || !guardianEmail || !guardianRelationship) {
      throw new BadRequestException(
        'Guardian name, email, and relationship are required when age is below the threshold.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
      throw new BadRequestException('Please provide a valid guardian email address.');
    }

    return {
      active: true,
      consentGivenBy: 'GUARDIAN',
      needsGuardianOtp: true,
      guardianEmail,
      recordEmail: guardianEmail,
      recordPhone: dto.phone,
      metadata: {
        ...baseMeta,
        belowThreshold: true,
        consentGivenBy: 'GUARDIAN',
        minor: { age: minorAge, name: dto.name || null },
        guardian: {
          name: guardianName,
          email: guardianEmail,
          relationship: guardianRelationship,
        },
      },
    };
  }
}
