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
exports.RightsRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const DEFAULT_WORKFLOW_STEPS = [
    { name: 'Received', order: 1, slaHours: null },
    { name: 'Identity Verified', order: 2, slaHours: 24 },
    { name: 'Acknowledged', order: 3, slaHours: 48 },
    { name: 'In Review', order: 4, slaHours: 72 },
    { name: 'Action Taken', order: 5, slaHours: 168 },
    { name: 'Response Sent', order: 6, slaHours: 24 },
    { name: 'Closed', order: 7, slaHours: null },
];
const STATUS_TRANSITIONS = {
    RECEIVED: [client_1.RightsRequestStatus.IDENTITY_VERIFIED, client_1.RightsRequestStatus.REJECTED, client_1.RightsRequestStatus.ON_HOLD],
    IDENTITY_VERIFIED: [client_1.RightsRequestStatus.ACKNOWLEDGED, client_1.RightsRequestStatus.REJECTED],
    ACKNOWLEDGED: [client_1.RightsRequestStatus.IN_REVIEW],
    IN_REVIEW: [client_1.RightsRequestStatus.ACTION_TAKEN, client_1.RightsRequestStatus.ESCALATED, client_1.RightsRequestStatus.ON_HOLD],
    ACTION_TAKEN: [client_1.RightsRequestStatus.RESPONSE_SENT],
    RESPONSE_SENT: [client_1.RightsRequestStatus.CLOSED],
    ESCALATED: [client_1.RightsRequestStatus.IN_REVIEW, client_1.RightsRequestStatus.CLOSED],
    ON_HOLD: [client_1.RightsRequestStatus.IN_REVIEW, client_1.RightsRequestStatus.RECEIVED],
    CLOSED: [],
    REJECTED: [],
};
const STATUS_TO_STEP = {
    RECEIVED: 'Received',
    IDENTITY_VERIFIED: 'Identity Verified',
    ACKNOWLEDGED: 'Acknowledged',
    IN_REVIEW: 'In Review',
    ACTION_TAKEN: 'Action Taken',
    RESPONSE_SENT: 'Response Sent',
    CLOSED: 'Closed',
};
let RightsRequestsService = class RightsRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        const { dueDate, tenantId, ...rest } = dto;
        const year = new Date().getFullYear();
        const count = await this.prisma.rightsRequest.count({
            where: {
                caseNumber: { startsWith: `RR-${year}-` },
            },
        });
        const caseNumber = `RR-${year}-${String(count + 1).padStart(6, '0')}`;
        return this.prisma.$transaction(async (prisma) => {
            const request = await prisma.rightsRequest.create({
                data: {
                    ...rest,
                    caseNumber,
                    dataCategories: rest.dataCategories || [],
                    relatedConsents: rest.relatedConsents || [],
                    relatedApplications: rest.relatedApplications || [],
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    tenantId,
                    currentStep: 'Received',
                },
            });
            await prisma.workflowStep.createMany({
                data: DEFAULT_WORKFLOW_STEPS.map((step) => ({
                    requestId: request.id,
                    name: step.name,
                    order: step.order,
                    slaHours: step.slaHours,
                    status: step.order === 1 ? 'WF_IN_PROGRESS' : 'WF_PENDING',
                })),
            });
            await prisma.rightsAuditEntry.create({
                data: {
                    requestId: request.id,
                    caseNumber,
                    action: 'Request Created',
                    performedBy: userId,
                    details: `Rights request ${caseNumber} created (type: ${rest.type})`,
                    severity: 'INFO',
                },
            });
            return this.findOne(request.id);
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.type)
            where.type = filters.type;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.assignedTo)
            where.assignedTo = filters.assignedTo;
        if (filters.tenantId)
            where.tenantId = filters.tenantId;
        if (filters.search) {
            where.OR = [
                { caseNumber: { contains: filters.search, mode: 'insensitive' } },
                { requesterName: { contains: filters.search, mode: 'insensitive' } },
                { requesterEmail: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const take = filters.limit ? Number(filters.limit) : 50;
        const skip = filters.offset ? Number(filters.offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.rightsRequest.count({ where }),
            this.prisma.rightsRequest.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { notes: true, attachments: true, evidenceItems: true } },
                },
            }),
        ]);
        const enriched = data.map((r) => this.enrichWithSla(r));
        return { total, page: Math.floor(skip / take) + 1, limit: take, data: enriched };
    }
    async findOne(id) {
        const request = await this.prisma.rightsRequest.findUnique({
            where: { id },
            include: {
                workflowSteps: { orderBy: { order: 'asc' } },
                _count: { select: { notes: true, attachments: true, evidenceItems: true } },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Rights Request not found');
        return this.enrichWithSla(request);
    }
    async update(id, dto) {
        await this.findOne(id);
        const { dueDate, ...rest } = dto;
        return this.prisma.rightsRequest.update({
            where: { id },
            data: {
                ...rest,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
        });
    }
    async updateStatus(id, dto, userId) {
        const request = await this.findOne(id);
        const currentStatus = request.status;
        const newStatus = dto.status;
        const allowed = STATUS_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${(allowed || []).join(', ') || 'none'}`);
        }
        return this.prisma.$transaction(async (prisma) => {
            const updateData = { status: newStatus, currentStep: STATUS_TO_STEP[newStatus] || newStatus };
            if (newStatus === client_1.RightsRequestStatus.ACKNOWLEDGED) {
                updateData.acknowledgedAt = new Date();
            }
            if (newStatus === client_1.RightsRequestStatus.CLOSED || newStatus === client_1.RightsRequestStatus.REJECTED) {
                updateData.closedAt = new Date();
            }
            const updated = await prisma.rightsRequest.update({
                where: { id },
                data: updateData,
            });
            const stepName = STATUS_TO_STEP[newStatus];
            if (stepName) {
                const currentStepName = STATUS_TO_STEP[currentStatus];
                if (currentStepName) {
                    await prisma.workflowStep.updateMany({
                        where: { requestId: id, name: currentStepName },
                        data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
                    });
                }
                await prisma.workflowStep.updateMany({
                    where: { requestId: id, name: stepName },
                    data: { status: 'WF_IN_PROGRESS' },
                });
            }
            await prisma.rightsAuditEntry.create({
                data: {
                    requestId: id,
                    caseNumber: request.caseNumber,
                    action: `Status changed: ${currentStatus} → ${newStatus}`,
                    performedBy: userId,
                    details: dto.note || undefined,
                    severity: newStatus === client_1.RightsRequestStatus.ESCALATED ? 'WARNING' : 'INFO',
                },
            });
            return updated;
        });
    }
    async assign(id, dto, userId) {
        const request = await this.findOne(id);
        const updated = await this.prisma.rightsRequest.update({
            where: { id },
            data: {
                assignedTo: dto.assignedTo,
                assignedTeam: dto.assignedTeam,
            },
        });
        await this.prisma.rightsAuditEntry.create({
            data: {
                requestId: id,
                caseNumber: request.caseNumber,
                action: 'Request assigned',
                performedBy: userId,
                details: `Assigned to: ${dto.assignedTo || 'N/A'}, Team: ${dto.assignedTeam || 'N/A'}`,
                severity: 'INFO',
            },
        });
        return updated;
    }
    async getWorkflow(id) {
        await this.findOne(id);
        return this.prisma.workflowStep.findMany({
            where: { requestId: id },
            orderBy: { order: 'asc' },
        });
    }
    async getNotes(id) {
        await this.findOne(id);
        return this.prisma.caseNote.findMany({
            where: { requestId: id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addNote(id, dto, userId) {
        const request = await this.findOne(id);
        const note = await this.prisma.caseNote.create({
            data: {
                requestId: id,
                type: dto.type || 'NOTE_INTERNAL',
                content: dto.content,
                createdBy: userId,
                attachments: dto.attachments || [],
            },
        });
        await this.prisma.rightsAuditEntry.create({
            data: {
                requestId: id,
                caseNumber: request.caseNumber,
                action: 'Note added',
                performedBy: userId,
                details: `${dto.type || 'INTERNAL'} note added`,
                severity: 'INFO',
            },
        });
        return note;
    }
    async getAttachments(id) {
        await this.findOne(id);
        return this.prisma.caseAttachment.findMany({
            where: { requestId: id },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async addAttachment(id, dto, userId) {
        const request = await this.findOne(id);
        const attachment = await this.prisma.caseAttachment.create({
            data: {
                requestId: id,
                fileName: dto.fileName,
                fileType: dto.fileType,
                fileSize: dto.fileSize,
                category: dto.category || 'ATT_OTHER',
                uploadedBy: userId,
                url: dto.url,
            },
        });
        await this.prisma.rightsAuditEntry.create({
            data: {
                requestId: id,
                caseNumber: request.caseNumber,
                action: 'Attachment added',
                performedBy: userId,
                details: `File: ${dto.fileName} (${dto.category || 'OTHER'})`,
                severity: 'INFO',
            },
        });
        return attachment;
    }
    async getEvidence(id) {
        await this.findOne(id);
        return this.prisma.evidenceItem.findMany({
            where: { requestId: id },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async addEvidence(id, dto, userId) {
        const request = await this.findOne(id);
        const evidence = await this.prisma.evidenceItem.create({
            data: {
                requestId: id,
                caseNumber: request.caseNumber,
                fileName: dto.fileName,
                fileType: dto.fileType,
                category: dto.category,
                uploadedBy: userId,
                size: dto.size,
                verified: dto.verified || false,
            },
        });
        await this.prisma.rightsAuditEntry.create({
            data: {
                requestId: id,
                caseNumber: request.caseNumber,
                action: 'Evidence added',
                performedBy: userId,
                details: `Evidence: ${dto.fileName} (${dto.category})`,
                severity: 'INFO',
            },
        });
        return evidence;
    }
    async getAuditTrail(id) {
        await this.findOne(id);
        return this.prisma.rightsAuditEntry.findMany({
            where: { requestId: id },
            orderBy: { performedAt: 'desc' },
        });
    }
    async getMetrics() {
        const [total, byStatus, byType, byPriority, slaBreached, closedRequests] = await Promise.all([
            this.prisma.rightsRequest.count(),
            this.prisma.rightsRequest.groupBy({ by: ['status'], _count: true }),
            this.prisma.rightsRequest.groupBy({ by: ['type'], _count: true }),
            this.prisma.rightsRequest.groupBy({ by: ['priority'], _count: true }),
            this.prisma.rightsRequest.count({
                where: {
                    dueDate: { lt: new Date() },
                    status: { notIn: [client_1.RightsRequestStatus.CLOSED, client_1.RightsRequestStatus.REJECTED] },
                },
            }),
            this.prisma.rightsRequest.findMany({
                where: {
                    status: client_1.RightsRequestStatus.CLOSED,
                    closedAt: { not: null },
                },
                select: { submittedAt: true, closedAt: true },
            }),
        ]);
        let avgResolutionDays = 0;
        if (closedRequests.length > 0) {
            const totalDays = closedRequests.reduce((sum, r) => {
                if (r.closedAt) {
                    return sum + (r.closedAt.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
                }
                return sum;
            }, 0);
            avgResolutionDays = Math.round((totalDays / closedRequests.length) * 10) / 10;
        }
        return {
            total,
            byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
            byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
            byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count])),
            slaBreached,
            avgResolutionDays,
        };
    }
    async getAnalytics() {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const [byRegulation, byChannel, byVerification, monthlyRequests, topDataCategories,] = await Promise.all([
            this.prisma.rightsRequest.groupBy({ by: ['regulation'], _count: true }),
            this.prisma.rightsRequest.groupBy({ by: ['submissionChannel'], _count: true }),
            this.prisma.rightsRequest.groupBy({
                by: ['verificationMethod'],
                _count: true,
                where: { verificationMethod: { not: null } },
            }),
            this.prisma.rightsRequest.findMany({
                where: { submittedAt: { gte: twelveMonthsAgo } },
                select: { submittedAt: true, status: true },
            }),
            this.prisma.rightsRequest.findMany({
                select: { dataCategories: true },
            }),
        ]);
        const monthlyTrend = {};
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend[key] = { total: 0, closed: 0, escalated: 0 };
        }
        for (const r of monthlyRequests) {
            const key = `${r.submittedAt.getFullYear()}-${String(r.submittedAt.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyTrend[key]) {
                monthlyTrend[key].total++;
                if (r.status === 'CLOSED')
                    monthlyTrend[key].closed++;
                if (r.status === 'ESCALATED')
                    monthlyTrend[key].escalated++;
            }
        }
        const categoryCount = {};
        for (const r of topDataCategories) {
            for (const cat of r.dataCategories) {
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            }
        }
        const sortedCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([category, count]) => ({ category, count }));
        return {
            byRegulation: Object.fromEntries(byRegulation.map((r) => [r.regulation, r._count])),
            byChannel: Object.fromEntries(byChannel.map((c) => [c.submissionChannel, c._count])),
            byVerificationMethod: Object.fromEntries(byVerification.map((v) => [v.verificationMethod, v._count])),
            monthlyTrend,
            topDataCategories: sortedCategories,
        };
    }
    enrichWithSla(request) {
        const now = new Date();
        let slaBreached = false;
        let daysRemaining = null;
        if (request.dueDate) {
            const due = new Date(request.dueDate);
            const diffMs = due.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            slaBreached = diffMs < 0 && !['CLOSED', 'REJECTED'].includes(request.status);
        }
        return { ...request, slaBreached, daysRemaining };
    }
};
exports.RightsRequestsService = RightsRequestsService;
exports.RightsRequestsService = RightsRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RightsRequestsService);
//# sourceMappingURL=rights-requests.service.js.map