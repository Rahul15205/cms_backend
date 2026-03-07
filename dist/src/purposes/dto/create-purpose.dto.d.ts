import { PurposeNecessity } from '@prisma/client';
export declare class CreatePurposeDto {
    name: string;
    description?: string;
    isPrimary?: boolean;
    necessity: PurposeNecessity;
    automatedProcessing?: boolean;
    profilingUsage?: boolean;
    templateId: string;
}
