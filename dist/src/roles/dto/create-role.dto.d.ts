import { RoleStatus, ModuleName } from '@prisma/client';
export declare class PermissionDto {
    module: ModuleName;
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    approve?: boolean;
    export?: boolean;
    configure?: boolean;
    admin?: boolean;
}
export declare class CreateRoleDto {
    name: string;
    description?: string;
    isSystemRole?: boolean;
    status: RoleStatus;
    isTemporary?: boolean;
    expiresAt?: Date;
    permissions: PermissionDto[];
}
