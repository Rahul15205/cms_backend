import { NoticeStatus } from '@prisma/client';
export declare class CreateNoticeDto {
    title: string;
    content?: string;
    status?: NoticeStatus;
    typeId?: string;
    tenantId?: string;
}
