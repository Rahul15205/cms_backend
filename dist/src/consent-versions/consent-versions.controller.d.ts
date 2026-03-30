import { ConsentVersionsService } from './consent-versions.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
export declare class ConsentVersionsController {
    private readonly consentVersionsService;
    constructor(consentVersionsService: ConsentVersionsService);
    create(createConsentVersionDto: CreateConsentVersionDto, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ConsentVersionStatus;
        createdAt: Date;
        content: string;
        versionNumber: number;
        changeSummary: string | null;
        changedFields: string[];
        changeReason: string | null;
        approvedBy: string | null;
        approvalTimestamp: Date | null;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
        usersImpacted: number;
        reconsentTriggered: boolean;
        publishedAt: Date;
        templateId: string;
        publishedBy: string;
    }>;
    findAll(templateId?: string, limit?: number, offset?: number): Promise<PaginatedResponseDto<{
        publisher: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ConsentVersionStatus;
        createdAt: Date;
        content: string;
        versionNumber: number;
        changeSummary: string | null;
        changedFields: string[];
        changeReason: string | null;
        approvedBy: string | null;
        approvalTimestamp: Date | null;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
        usersImpacted: number;
        reconsentTriggered: boolean;
        publishedAt: Date;
        templateId: string;
        publishedBy: string;
    }>>;
    findOne(id: string): Promise<{
        template: {
            type: import("@prisma/client").$Enums.ConsentType;
            id: string;
            status: import("@prisma/client").$Enums.TemplateStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            title: string;
            regulations: import("@prisma/client").$Enums.Regulation[];
            wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
            validityStart: Date | null;
            validityEnd: Date | null;
            noExpiry: boolean;
            targetUserCategory: import("@prisma/client").$Enums.TargetUserCategory[];
            ageThreshold: number;
            consentGivenBy: import("@prisma/client").$Enums.ConsentGivenBy;
            mechanism: import("@prisma/client").$Enums.ConsentMechanism;
            separateConsents: boolean;
            withdrawVisible: boolean;
            dataSharing: boolean;
            privacyNoticeRef: string | null;
            auditTrailEnabled: boolean;
            defaultLanguage: string;
            supportedLanguages: string[];
            createdBy: string;
        };
        publisher: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ConsentVersionStatus;
        createdAt: Date;
        content: string;
        versionNumber: number;
        changeSummary: string | null;
        changedFields: string[];
        changeReason: string | null;
        approvedBy: string | null;
        approvalTimestamp: Date | null;
        effectiveFrom: Date | null;
        effectiveTo: Date | null;
        usersImpacted: number;
        reconsentTriggered: boolean;
        publishedAt: Date;
        templateId: string;
        publishedBy: string;
    }>;
}
