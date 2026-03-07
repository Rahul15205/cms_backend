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
exports.NoticesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NoticesService = class NoticesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto, userId) {
        return this.prisma.notice.create({
            data: {
                ...dto,
                createdBy: userId,
            },
            include: { type: true },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.typeId)
            where.typeId = filters.typeId;
        if (filters.tenantId)
            where.tenantId = filters.tenantId;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const take = filters.limit ? Number(filters.limit) : 50;
        const skip = filters.offset ? Number(filters.offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.notice.count({ where }),
            this.prisma.notice.findMany({
                where,
                take,
                skip,
                orderBy: { updatedAt: 'desc' },
                include: {
                    type: true,
                    _count: { select: { acknowledgements: true, versions: true } },
                },
            }),
        ]);
        return { total, page: Math.floor(skip / take) + 1, limit: take, data };
    }
    async findOne(id) {
        const notice = await this.prisma.notice.findUnique({
            where: { id },
            include: {
                type: true,
                versions: { orderBy: { version: 'desc' } },
                _count: { select: { acknowledgements: true } },
            },
        });
        if (!notice)
            throw new common_1.NotFoundException('Notice not found');
        return notice;
    }
    async update(id, dto, userId) {
        const existing = await this.findOne(id);
        const shouldVersion = (dto.content !== undefined && dto.content !== existing.content) ||
            (dto.title !== undefined && dto.title !== existing.title);
        const updated = await this.prisma.notice.update({
            where: { id },
            data: dto,
            include: { type: true },
        });
        if (shouldVersion) {
            const nextVersion = existing.currentVersion + 1;
            await this.prisma.noticeVersion.create({
                data: {
                    noticeId: id,
                    version: nextVersion,
                    title: updated.title,
                    content: updated.content,
                    changes: `Updated: ${[dto.title ? 'title' : '', dto.content ? 'content' : ''].filter(Boolean).join(', ')}`,
                    author: userId,
                },
            });
            await this.prisma.notice.update({
                where: { id },
                data: { currentVersion: nextVersion },
            });
        }
        return updated;
    }
    async getHistory(noticeId) {
        await this.findOne(noticeId);
        return this.prisma.noticeVersion.findMany({
            where: { noticeId },
            orderBy: { version: 'desc' },
        });
    }
    getLanguages(tenantId) {
        const where = tenantId ? { tenantId } : {};
        return this.prisma.noticeLanguage.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    createType(dto) {
        return this.prisma.noticeType.create({
            data: dto,
        });
    }
    async getTypes(tenantId) {
        const where = tenantId ? { tenantId } : {};
        return this.prisma.noticeType.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { notices: true } } },
        });
    }
};
exports.NoticesService = NoticesService;
exports.NoticesService = NoticesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NoticesService);
//# sourceMappingURL=notices.service.js.map