import { AccessRuleType } from '@prisma/client';
export declare class CreateAccessRuleDto {
    name: string;
    type: AccessRuleType;
    status?: string;
    description?: string;
    conditions: Record<string, any>;
    priority?: number;
}
