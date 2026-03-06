import { SetMetadata } from '@nestjs/common';
import { ModuleName } from '@prisma/client';

export type PermissionType = 'view' | 'create' | 'edit' | 'approve' | 'export' | 'configure' | 'admin';

export interface RequiredPermission {
  module: ModuleName;
  action: PermissionType;
}

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: RequiredPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
