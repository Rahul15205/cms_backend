import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        tenantId?: string;
        userId?: string;
        category?: AuditCategory;
        severity?: AuditSeverity;
        startDate?: string;
        endDate?: string;
        limit?: number;
        page?: number;
        anonymize?: boolean;
    }): Promise<{
        data: ({
            user: {
                name: string;
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            tenantId: string | null;
            userId: string | null;
            category: import("@prisma/client").$Enums.AuditCategory;
            severity: import("@prisma/client").$Enums.AuditSeverity;
            action: string;
            details: import("@prisma/client/runtime/client").JsonValue | null;
            ipAddress: string | null;
        })[] | {
            user: {
                email: string | undefined;
                name: string;
            } | undefined;
            details: any;
            id: string;
            createdAt: Date;
            tenantId: string | null;
            userId: string | null;
            category: import("@prisma/client").$Enums.AuditCategory;
            severity: import("@prisma/client").$Enums.AuditSeverity;
            action: string;
            ipAddress: string | null;
        }[];
        total: number;
    }>;
    create(data: {
        userId?: string;
        action: string;
        category: AuditCategory;
        details?: any;
        ipAddress?: string;
        severity?: AuditSeverity;
        tenantId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string | null;
        userId: string | null;
        category: import("@prisma/client").$Enums.AuditCategory;
        severity: import("@prisma/client").$Enums.AuditSeverity;
        action: string;
        details: import("@prisma/client/runtime/client").JsonValue | null;
        ipAddress: string | null;
    }>;
}
