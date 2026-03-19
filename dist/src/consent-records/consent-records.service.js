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
exports.ConsentRecordsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ConsentRecordsService = class ConsentRecordsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createConsentRecordDto) {
        const { versionId, applicationId, userId, endUserEmail } = createConsentRecordDto;
        if (!userId && !endUserEmail) {
            throw new common_1.BadRequestException('Consent records must track either an internal userId or an endUserEmail');
        }
        const deployment = await this.prisma.consentDeployment.findUnique({
            where: {
                versionId_applicationId: { versionId, applicationId }
            }
        });
        if (!deployment || !deployment.isActive) {
            throw new common_1.BadRequestException('This consent version is not actively deployed to the specified application');
        }
        const recordPayload = {
            ...createConsentRecordDto,
            status: createConsentRecordDto.status || client_1.ConsentStatus.GRANTED,
            grantedAt: new Date()
        };
        if (recordPayload.status === client_1.ConsentStatus.REVOKED) {
            recordPayload.revokedAt = new Date();
        }
        const record = await this.prisma.consentRecord.create({
            data: recordPayload,
            include: {
                version: { include: { template: true } },
                application: true
            }
        });
        if (record.status === client_1.ConsentStatus.GRANTED) {
            await this.prisma.consentUsageRecord.create({
                data: {
                    userIdentifier: record.userId || record.endUserEmail || 'anonymous',
                    templateId: record.version.templateId,
                    version: record.version.versionNumber.toString(),
                    purposeMapped: record.version.template.title || 'General',
                    systemApp: record.application.name,
                    consentDateTime: record.grantedAt,
                    consentStatus: 'ACTIVE',
                }
            }).catch(err => {
                console.error('Failed to create automated usage record:', err);
            });
        }
        return record;
    }
    async findAll(status, versionId, applicationId, userId, email, limit, offset) {
        const where = {};
        if (status)
            where.status = status;
        if (versionId)
            where.versionId = versionId;
        if (applicationId)
            where.applicationId = applicationId;
        if (userId)
            where.userId = userId;
        if (email)
            where.endUserEmail = { contains: email, mode: 'insensitive' };
        const take = limit ? Number(limit) : 50;
        const skip = offset ? Number(offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.consentRecord.count({ where }),
            this.prisma.consentRecord.findMany({
                where,
                take,
                skip,
                orderBy: { grantedAt: 'desc' },
                include: {
                    version: { select: { template: { select: { title: true } } } },
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
        const record = await this.prisma.consentRecord.findUnique({
            where: { id },
            include: {
                version: { include: { template: true } },
                application: true
            }
        });
        if (!record)
            throw new common_1.NotFoundException('Consent Record not found');
        return record;
    }
    async update(id, updateConsentRecordDto) {
        const record = await this.findOne(id);
        const updateData = { ...updateConsentRecordDto };
        if (updateData.status === client_1.ConsentStatus.REVOKED && record.status !== client_1.ConsentStatus.REVOKED) {
            updateData.revokedAt = new Date();
        }
        return this.prisma.consentRecord.update({
            where: { id },
            data: updateData
        });
    }
};
exports.ConsentRecordsService = ConsentRecordsService;
exports.ConsentRecordsService = ConsentRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsentRecordsService);
//# sourceMappingURL=consent-records.service.js.map