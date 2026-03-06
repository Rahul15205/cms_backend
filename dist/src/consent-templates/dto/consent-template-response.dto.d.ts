import { TemplateStatus } from '@prisma/client';
export declare class ConsentTemplateResponseDto {
    id: string;
    title: string;
    description?: string;
    status: TemplateStatus;
    wizardFields?: Record<string, any>;
    tenantId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
