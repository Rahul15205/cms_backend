"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const masking_utils_1 = require("../common/utils/masking.utils");
let AuditLogsService = class AuditLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.userId)
            where.userId = filters.userId;
        if (filters?.category)
            where.category = filters.category;
        if (filters?.severity)
            where.severity = filters.severity;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.createdAt.lte = new Date(filters.endDate);
        }
        const take = filters?.limit ? Number(filters.limit) : 10;
        const page = filters?.page ? Number(filters.page) : 1;
        const skip = (page - 1) * take;
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } }
                }
            }),
            this.prisma.auditLog.count({ where })
        ]);
        const returnedData = filters?.anonymize
            ? data.map(log => ({
                ...log,
                user: log.user ? {
                    ...log.user,
                    email: log.user.email ? log.user.email.includes('@') ? log.user.email[0] + '***@' + log.user.email.split('@')[1] : log.user.email : undefined
                } : undefined,
                details: (0, masking_utils_1.maskObjectPii)(log.details)
            }))
            : data;
        return { data: returnedData, total };
    }
    async create(data) {
        return this.prisma.auditLog.create({ data });
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map