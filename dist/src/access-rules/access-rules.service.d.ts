import { PrismaService } from '../prisma/prisma.service';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';
export declare class AccessRulesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createAccessRuleDto: CreateAccessRuleDto, tenantId: string): import("@prisma/client").Prisma.Prisma__AccessRuleClient<{
        type: import("@prisma/client").$Enums.AccessRuleType;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        priority: number;
        conditions: import("@prisma/client/runtime/client").JsonValue;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(tenantId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        type: import("@prisma/client").$Enums.AccessRuleType;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        priority: number;
        conditions: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    findOne(id: string): Promise<{
        type: import("@prisma/client").$Enums.AccessRuleType;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        priority: number;
        conditions: import("@prisma/client/runtime/client").JsonValue;
    }>;
    update(id: string, updateAccessRuleDto: UpdateAccessRuleDto): Promise<{
        type: import("@prisma/client").$Enums.AccessRuleType;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        priority: number;
        conditions: import("@prisma/client/runtime/client").JsonValue;
    }>;
    remove(id: string): Promise<{
        type: import("@prisma/client").$Enums.AccessRuleType;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        priority: number;
        conditions: import("@prisma/client/runtime/client").JsonValue;
    }>;
}
