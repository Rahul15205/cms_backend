import { GrievanceCategory, GrievancePriority } from '@prisma/client';
export declare class CreateGrievanceDto {
    subject: string;
    description?: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    category: GrievanceCategory;
    priority?: GrievancePriority;
    tenantId?: string;
}
