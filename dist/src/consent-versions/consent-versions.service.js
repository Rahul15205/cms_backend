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
exports.ConsentVersionsService = void 0;
const common_1 = require("@nestjs/common");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ConsentVersionsService = class ConsentVersionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createConsentVersionDto, publisherId) {
        const { templateId, content, changeSummary, changedFields, changeReason, effectiveFrom, effectiveTo, reconsentTriggered } = createConsentVersionDto;
        const template = await this.prisma.consentTemplate.findUnique({
            where: { id: templateId },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
        });
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        if (template.status === client_1.TemplateStatus.ARCHIVED) {
            throw new common_1.BadRequestException('Cannot publish versions for an archived template');
        }
        const nextVersionNumber = template.versions.length > 0 ? template.versions[0].versionNumber + 1 : 1;
        return this.prisma.$transaction(async (prisma) => {
            const version = await prisma.consentVersion.create({
                data: {
                    versionNumber: nextVersionNumber,
                    content,
                    templateId,
                    publishedBy: publisherId,
                    changeSummary,
                    changedFields: changedFields || [],
                    changeReason,
                    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
                    effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
                    reconsentTriggered: reconsentTriggered || false,
                }
            });
            if (template.status === client_1.TemplateStatus.DRAFT) {
                await prisma.consentTemplate.update({
                    where: { id: templateId },
                    data: { status: client_1.TemplateStatus.PUBLISHED }
                });
            }
            return version;
        });
    }
    async findAll(templateId, limit, offset) {
        const where = {};
        if (templateId)
            where.templateId = templateId;
        const take = limit ? Number(limit) : 50;
        const skip = offset ? Number(offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.consentVersion.count({ where }),
            this.prisma.consentVersion.findMany({
                where,
                take,
                skip,
                orderBy: [{ templateId: 'desc' }, { versionNumber: 'desc' }],
                include: { publisher: { select: { name: true, email: true } } }
            })
        ]);
        return (0, paginated_response_dto_1.paginate)(data, total, Math.floor(skip / take) + 1, take);
    }
    async findOne(id) {
        const version = await this.prisma.consentVersion.findUnique({
            where: { id },
            include: {
                template: true,
                publisher: { select: { name: true, email: true } }
            }
        });
        if (!version)
            throw new common_1.NotFoundException('Consent Version not found');
        return version;
    }
};
exports.ConsentVersionsService = ConsentVersionsService;
exports.ConsentVersionsService = ConsentVersionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsentVersionsService);
//# sourceMappingURL=consent-versions.service.js.map