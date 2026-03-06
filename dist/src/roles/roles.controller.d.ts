import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto, req: any): Promise<{
        permissions: {
            create: boolean;
            id: string;
            module: import("@prisma/client").$Enums.ModuleName;
            view: boolean;
            edit: boolean;
            approve: boolean;
            export: boolean;
            configure: boolean;
            admin: boolean;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RoleStatus;
        createdAt: Date;
        description: string | null;
        isSystemRole: boolean;
        isTemporary: boolean;
        clonedFrom: string | null;
        expiresAt: Date | null;
        tenantId: string | null;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        permissions: {
            create: boolean;
            id: string;
            module: import("@prisma/client").$Enums.ModuleName;
            view: boolean;
            edit: boolean;
            approve: boolean;
            export: boolean;
            configure: boolean;
            admin: boolean;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RoleStatus;
        createdAt: Date;
        description: string | null;
        isSystemRole: boolean;
        isTemporary: boolean;
        clonedFrom: string | null;
        expiresAt: Date | null;
        tenantId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        permissions: {
            create: boolean;
            id: string;
            module: import("@prisma/client").$Enums.ModuleName;
            view: boolean;
            edit: boolean;
            approve: boolean;
            export: boolean;
            configure: boolean;
            admin: boolean;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RoleStatus;
        createdAt: Date;
        description: string | null;
        isSystemRole: boolean;
        isTemporary: boolean;
        clonedFrom: string | null;
        expiresAt: Date | null;
        tenantId: string | null;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        permissions: {
            create: boolean;
            id: string;
            module: import("@prisma/client").$Enums.ModuleName;
            view: boolean;
            edit: boolean;
            approve: boolean;
            export: boolean;
            configure: boolean;
            admin: boolean;
            roleId: string;
        }[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RoleStatus;
        createdAt: Date;
        description: string | null;
        isSystemRole: boolean;
        isTemporary: boolean;
        clonedFrom: string | null;
        expiresAt: Date | null;
        tenantId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.RoleStatus;
        createdAt: Date;
        description: string | null;
        isSystemRole: boolean;
        isTemporary: boolean;
        clonedFrom: string | null;
        expiresAt: Date | null;
        tenantId: string | null;
    }>;
}
