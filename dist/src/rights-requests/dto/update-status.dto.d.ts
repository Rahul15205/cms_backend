import { RightsRequestStatus } from '@prisma/client';
export declare class UpdateStatusDto {
    status: RightsRequestStatus;
    note?: string;
}
