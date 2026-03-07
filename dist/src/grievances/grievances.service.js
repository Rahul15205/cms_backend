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
exports.GrievancesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GrievancesService = class GrievancesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const { tenantId, ...rest } = dto;
        const year = new Date().getFullYear();
        const count = await this.prisma.grievance.count({
            where: { caseNumber: { startsWith: `GRV-${year}-` } },
        });
        const caseNumber = `GRV-${year}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.grievance.create({
            data: { ...rest, caseNumber, tenantId },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.category)
            where.category = filters.category;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.assignedTo)
            where.assignedTo = filters.assignedTo;
        if (filters.tenantId)
            where.tenantId = filters.tenantId;
        if (filters.search) {
            where.OR = [
                { caseNumber: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { userName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const take = filters.limit ? Number(filters.limit) : 50;
        const skip = filters.offset ? Number(filters.offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.grievance.count({ where }),
            this.prisma.grievance.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { comments: true } } },
            }),
        ]);
        return { total, page: Math.floor(skip / take) + 1, limit: take, data };
    }
    async findOne(id) {
        const grievance = await this.prisma.grievance.findUnique({
            where: { id },
            include: {
                comments: { orderBy: { createdAt: 'desc' } },
                _count: { select: { comments: true } },
            },
        });
        if (!grievance)
            throw new common_1.NotFoundException('Grievance not found');
        return grievance;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.grievance.update({ where: { id }, data: dto });
    }
    async addComment(id, dto, userId) {
        const grievance = await this.findOne(id);
        const comment = await this.prisma.grievanceComment.create({
            data: {
                grievanceId: id,
                content: dto.content,
                createdBy: userId,
            },
        });
        await this.prisma.grievance.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
        return comment;
    }
    async escalate(id, userId) {
        const grievance = await this.findOne(id);
        if (grievance.status === client_1.GrievanceStatus.ESCALATED) {
            throw new common_1.BadRequestException('Grievance is already escalated');
        }
        if (grievance.status === client_1.GrievanceStatus.RESOLVED) {
            throw new common_1.BadRequestException('Cannot escalate a resolved grievance');
        }
        const updated = await this.prisma.grievance.update({
            where: { id },
            data: {
                status: client_1.GrievanceStatus.ESCALATED,
                escalatedAt: new Date(),
            },
        });
        await this.prisma.grievanceComment.create({
            data: {
                grievanceId: id,
                content: `Grievance escalated by user`,
                createdBy: userId,
            },
        });
        return updated;
    }
    async getMetrics() {
        const [total, byStatus, byCategory, byPriority] = await Promise.all([
            this.prisma.grievance.count(),
            this.prisma.grievance.groupBy({ by: ['status'], _count: true }),
            this.prisma.grievance.groupBy({ by: ['category'], _count: true }),
            this.prisma.grievance.groupBy({ by: ['priority'], _count: true }),
        ]);
        return {
            total,
            byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
            byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
            byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count])),
        };
    }
};
exports.GrievancesService = GrievancesService;
exports.GrievancesService = GrievancesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GrievancesService);
//# sourceMappingURL=grievances.service.js.map