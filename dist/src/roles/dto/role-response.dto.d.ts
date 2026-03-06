import { RoleStatus } from '@prisma/client';
import { PermissionDto } from './create-role.dto';
export declare class RoleResponseDto {
    id: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    status: RoleStatus;
    tenantId?: string;
    isTemporary: boolean;
    clonedFrom?: string;
    expiresAt?: Date;
    createdAt: Date;
    permissions?: PermissionDto[];
}
