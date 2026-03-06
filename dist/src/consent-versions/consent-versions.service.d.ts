import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
export declare class ConsentVersionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createConsentVersionDto: CreateConsentVersionDto, publisherId: string): Promise<{
        id: string;
        content: string;
        versionNumber: number;
        publishedAt: Date;
        templateId: string;
        publishedBy: string;
    }>;
    findAll(templateId?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            publisher: {
                name: string;
                email: string;
            };
        } & {
            id: string;
            content: string;
            versionNumber: number;
            publishedAt: Date;
            templateId: string;
            publishedBy: string;
        })[];
    }>;
    findOne(id: string): Promise<{
        template: {
            id: string;
            status: import("@prisma/client").$Enums.TemplateStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            title: string;
            wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
            createdBy: string;
        };
        publisher: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        content: string;
        versionNumber: number;
        publishedAt: Date;
        templateId: string;
        publishedBy: string;
    }>;
}
