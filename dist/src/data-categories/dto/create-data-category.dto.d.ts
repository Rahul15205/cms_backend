import { DataCategory, DataSource } from '@prisma/client';
export declare class CreateDataCategoryDto {
    category: DataCategory;
    label: string;
    mandatory?: boolean;
    source?: DataSource;
    description?: string;
    country?: string;
    templateId: string;
}
