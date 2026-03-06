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
exports.ConsentDeploymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConsentDeploymentsService = class ConsentDeploymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createConsentDeploymentDto) {
        const { versionId, applicationId } = createConsentDeploymentDto;
        const version = await this.prisma.consentVersion.findUnique({ where: { id: versionId } });
        if (!version)
            throw new common_1.NotFoundException('Consent Version not found');
        const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
        if (!application)
            throw new common_1.NotFoundException('Application not found');
        const existing = await this.prisma.consentDeployment.findUnique({
            where: {
                versionId_applicationId: { versionId, applicationId }
            }
        });
        if (existing) {
            throw new common_1.ConflictException('This version is already deployed to this application.');
        }
        return this.prisma.consentDeployment.create({
            data: createConsentDeploymentDto
        });
    }
    async findAll(applicationId, versionId, limit, offset) {
        const where = {};
        if (applicationId)
            where.applicationId = applicationId;
        if (versionId)
            where.versionId = versionId;
        const take = limit ? Number(limit) : 50;
        const skip = offset ? Number(offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.consentDeployment.count({ where }),
            this.prisma.consentDeployment.findMany({
                where,
                take,
                skip,
                orderBy: { deployedAt: 'desc' },
                include: {
                    version: { select: { versionNumber: true, templateId: true } },
                    application: { select: { name: true } }
                }
            })
        ]);
        return {
            total,
            page: Math.floor(skip / take) + 1,
            limit: take,
            data
        };
    }
    async findOne(id) {
        const deployment = await this.prisma.consentDeployment.findUnique({
            where: { id },
            include: {
                version: { include: { template: { select: { title: true } } } },
                application: true
            }
        });
        if (!deployment)
            throw new common_1.NotFoundException('Consent Deployment not found');
        return deployment;
    }
    async update(id, updateConsentDeploymentDto) {
        await this.findOne(id);
        return this.prisma.consentDeployment.update({
            where: { id },
            data: updateConsentDeploymentDto
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.consentDeployment.delete({
            where: { id }
        });
    }
};
exports.ConsentDeploymentsService = ConsentDeploymentsService;
exports.ConsentDeploymentsService = ConsentDeploymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsentDeploymentsService);
//# sourceMappingURL=consent-deployments.service.js.map