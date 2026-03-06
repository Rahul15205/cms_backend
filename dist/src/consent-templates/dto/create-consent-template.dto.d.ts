import { TemplateStatus } from '@prisma/client';
export declare class CreateConsentTemplateDto {
    title: string;
    description?: string;
    status?: TemplateStatus;
    wizardFields?: Record<string, any>;
}
