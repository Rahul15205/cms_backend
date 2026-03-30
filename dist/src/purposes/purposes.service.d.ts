import { CreatePurposeDto } from './dto/create-purpose.dto';
import { UpdatePurposeDto } from './dto/update-purpose.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class PurposesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createPurposeDto: CreatePurposeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrimary: boolean;
        necessity: import("@prisma/client").$Enums.PurposeNecessity;
        automatedProcessing: boolean;
        profilingUsage: boolean;
        templateId: string;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrimary: boolean;
        necessity: import("@prisma/client").$Enums.PurposeNecessity;
        automatedProcessing: boolean;
        profilingUsage: boolean;
        templateId: string;
    }[]>;
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
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrimary: boolean;
        necessity: import("@prisma/client").$Enums.PurposeNecessity;
        automatedProcessing: boolean;
        profilingUsage: boolean;
        templateId: string;
    }>;
    update(id: string, updatePurposeDto: UpdatePurposeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrimary: boolean;
        necessity: import("@prisma/client").$Enums.PurposeNecessity;
        automatedProcessing: boolean;
        profilingUsage: boolean;
        templateId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isPrimary: boolean;
        necessity: import("@prisma/client").$Enums.PurposeNecessity;
        automatedProcessing: boolean;
        profilingUsage: boolean;
        templateId: string;
    }>;
}
