import { ConsentStatus } from '@prisma/client';
export declare class CreateConsentRecordDto {
    versionId: string;
    applicationId: string;
    userId?: string;
    endUserEmail?: string;
    endUserPhone?: string;
    endUserIp?: string;
    status?: ConsentStatus;
    metadata?: Record<string, any>;
}
