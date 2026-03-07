import { CaseNoteType } from '@prisma/client';
export declare class CreateCaseNoteDto {
    type?: CaseNoteType;
    content: string;
    attachments?: string[];
}
