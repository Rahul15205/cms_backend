import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';
export declare class UsersService {
    private prisma;
    private encryptionService;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
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
        emailHash: string | null;
        password: string;
        phone: string | null;
        phoneHash: string | null;
        aadhaarNumber: string | null;
        aadhaarHash: string | null;
        aadhaarVerified: boolean;
        aadhaarVerifiedAt: Date | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        department: string | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
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
    }): Promise<import("../common/dto/paginated-response.dto").PaginatedResponseDto<any>>;
    findOne(id: string): Promise<any>;
    private decryptUser;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
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
        emailHash: string | null;
        password: string;
        phone: string | null;
        phoneHash: string | null;
        aadhaarNumber: string | null;
        aadhaarHash: string | null;
        aadhaarVerified: boolean;
        aadhaarVerifiedAt: Date | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        department: string | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        lastLogin: Date | null;
        validFrom: Date | null;
        validUntil: Date | null;
        riskScore: number;
        workflowAccess: import("@prisma/client/runtime/client").JsonValue | null;
        apiAccess: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
