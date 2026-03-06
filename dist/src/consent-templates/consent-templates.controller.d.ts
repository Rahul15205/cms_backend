import { ConsentTemplatesService } from './consent-templates.service';
import { CreateConsentTemplateDto } from './dto/create-consent-template.dto';
import { UpdateConsentTemplateDto } from './dto/update-consent-template.dto';
import { TemplateStatus } from '@prisma/client';
export declare class ConsentTemplatesController {
    private readonly consentTemplatesService;
    constructor(consentTemplatesService: ConsentTemplatesService);
    create(createConsentTemplateDto: CreateConsentTemplateDto, req: any): import("@prisma/client").Prisma.Prisma__ConsentTemplateClient<{
        id: string;
        status: import("@prisma/client").$Enums.TemplateStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        title: string;
        wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
        createdBy: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(status?: TemplateStatus, search?: string, tenantId?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            creator: {
                name: string;
                email: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.TemplateStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            title: string;
            wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
            createdBy: string;
        })[];
    }>;
    findOne(id: string): Promise<{
        creator: {
            name: string;
            email: string;
        };
        versions: {
            id: string;
            content: string;
            versionNumber: number;
            publishedAt: Date;
            templateId: string;
            publishedBy: string;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TemplateStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        title: string;
        wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
        createdBy: string;
    }>;
    update(id: string, updateConsentTemplateDto: UpdateConsentTemplateDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TemplateStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        title: string;
        wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
        createdBy: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TemplateStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        title: string;
        wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
        createdBy: string;
    }>;
}
