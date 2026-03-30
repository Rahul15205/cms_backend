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
exports.ConsentTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ConsentTemplatesService = class ConsentTemplatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createConsentTemplateDto, tenantId, creatorId) {
        return this.prisma.consentTemplate.create({
            data: {
                ...createConsentTemplateDto,
                tenantId,
                createdBy: creatorId
            }
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.status)
            where.status = filters.status;
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const take = filters?.limit ? Number(filters.limit) : 50;
        const skip = filters?.offset ? Number(filters.offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.consentTemplate.count({ where }),
            this.prisma.consentTemplate.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: { select: { name: true, email: true } },
                    versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
                }
            })
        ]);
        return (0, paginated_response_dto_1.paginate)(data, total, Math.floor(skip / take) + 1, take);
    }
    async findOne(id) {
        const template = await this.prisma.consentTemplate.findUnique({
            where: { id },
            include: {
                creator: { select: { name: true, email: true } },
                versions: { orderBy: { versionNumber: 'desc' }, take: 10 }
            }
        });
        if (!template)
            throw new common_1.NotFoundException('Consent Template not found');
        return template;
    }
    async update(id, updateConsentTemplateDto) {
        await this.findOne(id);
        return this.prisma.consentTemplate.update({
            where: { id },
            data: updateConsentTemplateDto
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.consentTemplate.update({
            where: { id },
            data: { status: client_1.TemplateStatus.ARCHIVED }
        });
    }
};
exports.ConsentTemplatesService = ConsentTemplatesService;
exports.ConsentTemplatesService = ConsentTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsentTemplatesService);
//# sourceMappingURL=consent-templates.service.js.map