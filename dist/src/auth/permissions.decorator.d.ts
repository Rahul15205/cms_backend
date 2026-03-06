import { ModuleName } from '@prisma/client';
export type PermissionType = 'view' | 'create' | 'edit' | 'approve' | 'export' | 'configure' | 'admin';
export interface RequiredPermission {
    module: ModuleName;
    action: PermissionType;
}
export declare const PERMISSIONS_KEY = "permissions";
export declare const Permissions: (...permissions: RequiredPermission[]) => import("@nestjs/common").CustomDecorator<string>;
