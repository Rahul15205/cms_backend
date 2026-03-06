import { AuditLogsService } from './audit-logs.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(tenantId?: string, userId?: string, category?: AuditCategory, severity?: AuditSeverity, startDate?: string, endDate?: string, limit?: number, offset?: number): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        tenantId: string | null;
        userId: string | null;
        ipAddress: string | null;
        category: import("@prisma/client").$Enums.AuditCategory;
        severity: import("@prisma/client").$Enums.AuditSeverity;
        action: string;
        details: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
}
