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
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../encryption/encryption.service");
const notifications_service_1 = require("../notifications/notifications.service");
let GrievancesService = class GrievancesService {
    prisma;
    encryptionService;
    notificationsService;
    constructor(prisma, encryptionService, notificationsService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.notificationsService = notificationsService;
    }
    async create(dto) {
        const { tenantId, ...rest } = dto;
        const year = new Date().getFullYear();
        const count = await this.prisma.grievance.count({
            where: { caseNumber: { startsWith: `GRV-${year}-` } },
        });
        const caseNumber = `GRV-${year}-${String(count + 1).padStart(4, '0')}`;
        const encryptedEmail = rest.userEmail ? this.encryptionService.encrypt(rest.userEmail) : null;
        const emailHash = rest.userEmail ? this.encryptionService.generateHash(rest.userEmail) : null;
        const grievance = await this.prisma.grievance.create({
            data: {
                ...rest,
                userEmail: encryptedEmail,
                userEmailHash: emailHash,
                caseNumber,
                tenantId
            },
        });
        if (rest.userEmail) {
            this.notificationsService.sendGrievanceConfirmation(rest.userEmail, rest.userName || 'User', caseNumber, rest.subject);
        }
        return grievance;
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
            const searchHash = this.encryptionService.generateHash(filters.search);
            where.OR = [
                { caseNumber: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { userName: { contains: filters.search, mode: 'insensitive' } },
                { userEmailHash: searchHash },
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
        const enriched = data.map((g) => this.decryptGrievance(g));
        return (0, paginated_response_dto_1.paginate)(enriched, total, Math.floor(skip / take) + 1, take);
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
        return this.decryptGrievance(grievance);
    }
    decryptGrievance(grievance) {
        if (!grievance)
            return grievance;
        return {
            ...grievance,
            userEmail: grievance.userEmail ? this.encryptionService.decrypt(grievance.userEmail) : null,
        };
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
        if (grievance.userEmail) {
            this.notificationsService.sendGrievanceUpdateAlert(grievance.userEmail, grievance.userName || 'User', grievance.caseNumber, grievance.status, dto.content);
        }
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
        if (grievance.userEmail) {
            this.notificationsService.sendGrievanceUpdateAlert(grievance.userEmail, grievance.userName || 'User', grievance.caseNumber, client_1.GrievanceStatus.ESCALATED, `Grievance has been escalated for priority review.`);
        }
        return updated;
    }
    async getMetrics() {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const [total, byStatus, byCategory, byPriority, trendResult, resolvedGrievances] = await Promise.all([
            this.prisma.grievance.count(),
            this.prisma.grievance.groupBy({ by: ['status'], _count: true }),
            this.prisma.grievance.groupBy({ by: ['category'], _count: true }),
            this.prisma.grievance.groupBy({ by: ['priority'], _count: true }),
            this.prisma.grievance.findMany({
                where: { createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true },
            }),
            this.prisma.grievance.findMany({
                where: { status: client_1.GrievanceStatus.RESOLVED },
                select: { createdAt: true, updatedAt: true },
            }),
        ]);
        const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendMap = {};
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
            trendMap[key] = 0;
        }
        trendResult.forEach((g) => {
            const d = g.createdAt;
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
            if (trendMap[key] !== undefined)
                trendMap[key]++;
        });
        const trendData = Object.entries(trendMap)
            .map(([name, cases]) => ({ name, cases }))
            .reverse();
        let avgResolutionDays = 0;
        const distribution = {
            under24h: 0,
            days1_3: 0,
            days3_7: 0,
            over7d: 0,
        };
        if (resolvedGrievances.length > 0) {
            let totalMs = 0;
            resolvedGrievances.forEach((g) => {
                const diff = g.updatedAt.getTime() - g.createdAt.getTime();
                totalMs += diff;
                const hours = diff / (1000 * 60 * 60);
                if (hours < 24)
                    distribution.under24h++;
                else if (hours < 72)
                    distribution.days1_3++;
                else if (hours < 168)
                    distribution.days3_7++;
                else
                    distribution.over7d++;
            });
            avgResolutionDays = Math.round((totalMs / resolvedGrievances.length / (1000 * 60 * 60 * 24)) * 10) / 10;
        }
        const resolutionTimeDistribution = [
            { name: "< 24 hours", value: distribution.under24h, color: "hsl(142, 76%, 36%)" },
            { name: "1-3 days", value: distribution.days1_3, color: "hsl(199, 89%, 48%)" },
            { name: "3-7 days", value: distribution.days3_7, color: "hsl(38, 92%, 50%)" },
            { name: " > 7 days", value: distribution.over7d, color: "hsl(0, 72%, 51%)" },
        ];
        return {
            total,
            open: statusMap[client_1.GrievanceStatus.OPEN] || 0,
            inProgress: statusMap[client_1.GrievanceStatus.IN_PROGRESS] || 0,
            resolved: statusMap[client_1.GrievanceStatus.RESOLVED] || 0,
            escalated: statusMap[client_1.GrievanceStatus.ESCALATED] || 0,
            trendData,
            avgResolutionDays,
            resolutionTimeDistribution,
            byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
            byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count])),
        };
    }
};
exports.GrievancesService = GrievancesService;
exports.GrievancesService = GrievancesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService,
        notifications_service_1.NotificationsService])
], GrievancesService);
//# sourceMappingURL=grievances.service.js.map