import { PurposesService } from './purposes.service';
import { CreatePurposeDto } from './dto/create-purpose.dto';
import { UpdatePurposeDto } from './dto/update-purpose.dto';
export declare class PurposesController {
    private readonly purposesService;
    constructor(purposesService: PurposesService);
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
