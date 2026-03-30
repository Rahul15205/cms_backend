import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<{
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
    findAll(status?: UserStatus, search?: string, tenantId?: string, limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponseDto<any>>;
    findOne(id: string): Promise<any>;
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
