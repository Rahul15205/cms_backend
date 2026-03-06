import { ConsentStatus } from '@prisma/client';
export declare class ConsentRecordResponseDto {
    id: string;
    versionId: string;
    applicationId: string;
    userId?: string;
    endUserEmail?: string;
    endUserIp?: string;
    status: ConsentStatus;
    grantedAt: Date;
    revokedAt?: Date;
    metadata?: Record<string, any>;
}
