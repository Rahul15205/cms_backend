import { AccessRulesService } from './access-rules.service';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';
export declare class AccessRulesController {
    private readonly accessRulesService;
    constructor(accessRulesService: AccessRulesService);
    create(createAccessRuleDto: CreateAccessRuleDto, req: any): import("@prisma/client").Prisma.Prisma__AccessRuleClient<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        type: import("@prisma/client").$Enums.AccessRuleType;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        priority: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(tenantId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        type: import("@prisma/client").$Enums.AccessRuleType;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        priority: number;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        type: import("@prisma/client").$Enums.AccessRuleType;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        priority: number;
    }>;
    update(id: string, updateAccessRuleDto: UpdateAccessRuleDto): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        type: import("@prisma/client").$Enums.AccessRuleType;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        priority: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AccessRuleStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        type: import("@prisma/client").$Enums.AccessRuleType;
        conditions: import("@prisma/client/runtime/client").JsonValue;
        priority: number;
    }>;
}
