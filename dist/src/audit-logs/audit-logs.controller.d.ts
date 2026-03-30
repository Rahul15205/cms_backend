import { AuditLogsService } from './audit-logs.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(tenantId?: string, userId?: string, category?: AuditCategory, severity?: AuditSeverity, startDate?: string, endDate?: string, limit?: number, page?: number, anonymize?: string): Promise<{
        total: number;
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
        page: number;
        limit: number;
    }>;
}
