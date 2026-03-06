import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto, tenantId: string): Promise<{
        roles: {
            roleId: string;
            userId: string;
        }[];
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        password: string;
        phone: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        department: string | null;
        mfaEnabled: boolean;
        lastLogin: Date | null;
        validFrom: Date | null;
        validUntil: Date | null;
        riskScore: number;
        workflowAccess: import("@prisma/client/runtime/client").JsonValue | null;
        apiAccess: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findAll(filters?: {
        status?: UserStatus;
        tenantId?: string;
        search?: string;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        data: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            roles: ({
                role: {
                    name: string;
                };
            } & {
                roleId: string;
                userId: string;
            })[];
            tenantId: string;
            email: string;
            phone: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
            department: string | null;
            mfaEnabled: boolean;
            lastLogin: Date | null;
            validFrom: Date | null;
            validUntil: Date | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        roles: ({
            role: {
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
            };
        } & {
            roleId: string;
            userId: string;
        })[];
        tenant: {
            id: string;
            domain: string | null;
            name: string;
            status: import("@prisma/client").$Enums.TenantStatus;
            settings: import("@prisma/client/runtime/client").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        password: string;
        phone: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        department: string | null;
        mfaEnabled: boolean;
        lastLogin: Date | null;
        validFrom: Date | null;
        validUntil: Date | null;
        riskScore: number;
        workflowAccess: import("@prisma/client/runtime/client").JsonValue | null;
        apiAccess: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
    }>;
    updateStatus(id: string, status: UserStatus): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        password: string;
        phone: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        department: string | null;
        mfaEnabled: boolean;
        lastLogin: Date | null;
        validFrom: Date | null;
        validUntil: Date | null;
        riskScore: number;
        workflowAccess: import("@prisma/client/runtime/client").JsonValue | null;
        apiAccess: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
