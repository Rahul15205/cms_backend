import { CreateSubProcessorDto } from './dto/create-sub-processor.dto';
import { UpdateSubProcessorDto } from './dto/update-sub-processor.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class SubProcessorsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createSubProcessorDto: CreateSubProcessorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        changeNotification: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        changeNotification: string | null;
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
        purpose: string;
        templateId: string;
        country: string;
        changeNotification: string | null;
    }>;
    update(id: string, updateSubProcessorDto: UpdateSubProcessorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        changeNotification: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        changeNotification: string | null;
    }>;
}
