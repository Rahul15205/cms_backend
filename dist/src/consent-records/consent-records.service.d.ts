import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentRecordDto } from './dto/create-consent-record.dto';
import { UpdateConsentRecordDto } from './dto/update-consent-record.dto';
import { ConsentStatus } from '@prisma/client';
export declare class ConsentRecordsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createConsentRecordDto: CreateConsentRecordDto): Promise<{
        application: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            apiKey: string;
        };
        version: {
            template: {
                id: string;
                status: import("@prisma/client").$Enums.TemplateStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                tenantId: string;
                title: string;
                type: import("@prisma/client").$Enums.ConsentType;
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ConsentStatus;
        userId: string | null;
        versionId: string;
        applicationId: string;
        endUserEmail: string | null;
        endUserIp: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        grantedAt: Date;
        revokedAt: Date | null;
    }>;
    findAll(status?: ConsentStatus, versionId?: string, applicationId?: string, userId?: string, email?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            application: {
                name: string;
            };
            version: {
                template: {
                    title: string;
                };
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ConsentStatus;
            userId: string | null;
            versionId: string;
            applicationId: string;
            endUserEmail: string | null;
            endUserIp: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            grantedAt: Date;
            revokedAt: Date | null;
        })[];
    }>;
    findOne(id: string): Promise<{
        application: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            apiKey: string;
        };
        version: {
            template: {
                id: string;
                status: import("@prisma/client").$Enums.TemplateStatus;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                tenantId: string;
                title: string;
                type: import("@prisma/client").$Enums.ConsentType;
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ConsentStatus;
        userId: string | null;
        versionId: string;
        applicationId: string;
        endUserEmail: string | null;
        endUserIp: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        grantedAt: Date;
        revokedAt: Date | null;
    }>;
    update(id: string, updateConsentRecordDto: UpdateConsentRecordDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ConsentStatus;
        userId: string | null;
        versionId: string;
        applicationId: string;
        endUserEmail: string | null;
        endUserIp: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        grantedAt: Date;
        revokedAt: Date | null;
    }>;
}
