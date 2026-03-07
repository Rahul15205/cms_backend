import { AttachmentCategory } from '@prisma/client';
export declare class CreateCaseAttachmentDto {
    fileName: string;
    fileType: string;
    fileSize: string;
    category?: AttachmentCategory;
    url: string;
}
