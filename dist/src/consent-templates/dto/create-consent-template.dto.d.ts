import { TemplateStatus, ConsentType, Regulation, TargetUserCategory, ConsentGivenBy, ConsentMechanism } from '@prisma/client';
export declare class CreateConsentTemplateDto {
    title: string;
    description?: string;
    type?: ConsentType;
    regulations?: Regulation[];
    status?: TemplateStatus;
    noExpiry?: boolean;
    targetUserCategory?: TargetUserCategory[];
    ageThreshold?: number;
    consentGivenBy?: ConsentGivenBy;
    mechanism?: ConsentMechanism;
    separateConsents?: boolean;
    withdrawVisible?: boolean;
    dataSharing?: boolean;
    privacyNoticeRef?: string;
    auditTrailEnabled?: boolean;
    defaultLanguage?: string;
    supportedLanguages?: string[];
    wizardFields?: Record<string, any>;
}
