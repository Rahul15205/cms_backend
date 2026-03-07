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
const client_1 = require("@prisma/client");
let ConsentDeploymentsService = class ConsentDeploymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createConsentDeploymentDto, deployedBy) {
        const { versionId, applicationId, activationDate, ...rest } = createConsentDeploymentDto;
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
        return this.prisma.$transaction(async (prisma) => {
            const deployment = await prisma.consentDeployment.create({
                data: {
                    versionId,
                    applicationId,
                    ...rest,
                    activationDate: activationDate ? new Date(activationDate) : undefined,
                    deployedBy,
                    status: client_1.DeploymentStatus.DEPLOYED,
                }
            });
            await prisma.deploymentLog.create({
                data: {
                    deploymentId: deployment.id,
                    action: 'Deployed',
                    performedBy: deployedBy || 'system',
                    details: `Deployed version to application ${application.name}`,
                    status: 'SUCCESS',
                }
            });
            return deployment;
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
                application: true,
                logs: { orderBy: { timestamp: 'desc' } }
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
    async rollback(id, performedBy) {
        const deployment = await this.findOne(id);
        if (!deployment.rollbackAllowed) {
            throw new common_1.BadRequestException('Rollback is not allowed for this deployment');
        }
        if (deployment.status === client_1.DeploymentStatus.ROLLED_BACK) {
            throw new common_1.BadRequestException('This deployment has already been rolled back');
        }
        return this.prisma.$transaction(async (prisma) => {
            const updated = await prisma.consentDeployment.update({
                where: { id },
                data: {
                    status: client_1.DeploymentStatus.ROLLED_BACK,
                    isActive: false,
                }
            });
            await prisma.deploymentLog.create({
                data: {
                    deploymentId: id,
                    action: 'Rolled back',
                    performedBy,
                    details: 'Deployment rolled back',
                    status: 'SUCCESS',
                }
            });
            return updated;
        });
    }
    async getDeploymentLogs(deploymentId) {
        await this.findOne(deploymentId);
        return this.prisma.deploymentLog.findMany({
            where: { deploymentId },
            orderBy: { timestamp: 'desc' }
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