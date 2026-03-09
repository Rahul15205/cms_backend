import { CreateDataCategoryDto } from './dto/create-data-category.dto';
import { UpdateDataCategoryDto } from './dto/update-data-category.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class DataCategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createDataCategoryDto: CreateDataCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        category: import("@prisma/client").$Enums.DataCategory;
        templateId: string;
        label: string;
        mandatory: boolean;
        source: import("@prisma/client").$Enums.DataSource;
        country: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        category: import("@prisma/client").$Enums.DataCategory;
        templateId: string;
        label: string;
        mandatory: boolean;
        source: import("@prisma/client").$Enums.DataSource;
        country: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        category: import("@prisma/client").$Enums.DataCategory;
        templateId: string;
        label: string;
        mandatory: boolean;
        source: import("@prisma/client").$Enums.DataSource;
        country: string | null;
    }>;
    update(id: string, updateDataCategoryDto: UpdateDataCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        category: import("@prisma/client").$Enums.DataCategory;
        templateId: string;
        label: string;
        mandatory: boolean;
        source: import("@prisma/client").$Enums.DataSource;
        country: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        category: import("@prisma/client").$Enums.DataCategory;
        templateId: string;
        label: string;
        mandatory: boolean;
        source: import("@prisma/client").$Enums.DataSource;
        country: string | null;
    }>;
}
