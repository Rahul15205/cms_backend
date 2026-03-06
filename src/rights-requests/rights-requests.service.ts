import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRightsRequestDto } from './dto/create-rights-request.dto';
import { UpdateRightsRequestDto } from './dto/update-rights-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { CreateCaseAttachmentDto } from './dto/create-case-attachment.dto';
import { CreateEvidenceItemDto } from './dto/create-evidence-item.dto';
import { RightsRequestStatus } from '@prisma/client';

// Default workflow steps per flow spec (Section 4 — 7 steps)
const DEFAULT_WORKFLOW_STEPS = [
  { name: 'Received', order: 1, slaHours: null },
  { name: 'Identity Verified', order: 2, slaHours: 24 },
  { name: 'Acknowledged', order: 3, slaHours: 48 },
  { name: 'In Review', order: 4, slaHours: 72 },
  { name: 'Action Taken', order: 5, slaHours: 168 },
  { name: 'Response Sent', order: 6, slaHours: 24 },
  { name: 'Closed', order: 7, slaHours: null },
];

// Valid status transitions (state machine)
const STATUS_TRANSITIONS: Record<RightsRequestStatus, RightsRequestStatus[]> = {
  RECEIVED: [RightsRequestStatus.IDENTITY_VERIFIED, RightsRequestStatus.REJECTED, RightsRequestStatus.ON_HOLD],
  IDENTITY_VERIFIED: [RightsRequestStatus.ACKNOWLEDGED, RightsRequestStatus.REJECTED],
  ACKNOWLEDGED: [RightsRequestStatus.IN_REVIEW],
  IN_REVIEW: [RightsRequestStatus.ACTION_TAKEN, RightsRequestStatus.ESCALATED, RightsRequestStatus.ON_HOLD],
  ACTION_TAKEN: [RightsRequestStatus.RESPONSE_SENT],
  RESPONSE_SENT: [RightsRequestStatus.CLOSED],
  ESCALATED: [RightsRequestStatus.IN_REVIEW, RightsRequestStatus.CLOSED],
  ON_HOLD: [RightsRequestStatus.IN_REVIEW, RightsRequestStatus.RECEIVED],
  CLOSED: [],
  REJECTED: [],
};

// Map status to workflow step name for auto-progression
const STATUS_TO_STEP: Partial<Record<RightsRequestStatus, string>> = {
  RECEIVED: 'Received',
  IDENTITY_VERIFIED: 'Identity Verified',
  ACKNOWLEDGED: 'Acknowledged',
  IN_REVIEW: 'In Review',
  ACTION_TAKEN: 'Action Taken',
  RESPONSE_SENT: 'Response Sent',
  CLOSED: 'Closed',
};

@Injectable()
export class RightsRequestsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // PHASE 2: Core CRUD
  // ==========================================

  async create(dto: CreateRightsRequestDto, userId: string) {
    const { dueDate, tenantId, ...rest } = dto;

    // Generate case number: RR-{YEAR}-{PADDED_SEQ}
    const year = new Date().getFullYear();
    const count = await this.prisma.rightsRequest.count({
      where: {
        caseNumber: { startsWith: `RR-${year}-` },
      },
    });
    const caseNumber = `RR-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (prisma) => {
      // Create the request
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

      // Auto-create 7 default workflow steps
      await prisma.workflowStep.createMany({
        data: DEFAULT_WORKFLOW_STEPS.map((step) => ({
          requestId: request.id,
          name: step.name,
          order: step.order,
          slaHours: step.slaHours,
          status: step.order === 1 ? 'WF_IN_PROGRESS' as const : 'WF_PENDING' as const,
        })),
      });

      // Create initial audit entry
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

  async findAll(filters: {
    status?: RightsRequestStatus;
    type?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.tenantId) where.tenantId = filters.tenantId;
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

    // Compute SLA fields at query time
    const enriched = data.map((r) => this.enrichWithSla(r));

    return { total, page: Math.floor(skip / take) + 1, limit: take, data: enriched };
  }

  async findOne(id: string) {
    const request = await this.prisma.rightsRequest.findUnique({
      where: { id },
      include: {
        workflowSteps: { orderBy: { order: 'asc' } },
        _count: { select: { notes: true, attachments: true, evidenceItems: true } },
      },
    });

    if (!request) throw new NotFoundException('Rights Request not found');
    return this.enrichWithSla(request);
  }

  async update(id: string, dto: UpdateRightsRequestDto) {
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

  // ==========================================
  // PHASE 3: Workflow Engine
  // ==========================================

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;
    const newStatus = dto.status;

    // Validate transition
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${(allowed || []).join(', ') || 'none'}`,
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update request status
      const updateData: any = { status: newStatus, currentStep: STATUS_TO_STEP[newStatus] || newStatus };

      if (newStatus === RightsRequestStatus.ACKNOWLEDGED) {
        updateData.acknowledgedAt = new Date();
      }
      if (newStatus === RightsRequestStatus.CLOSED || newStatus === RightsRequestStatus.REJECTED) {
        updateData.closedAt = new Date();
      }

      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: updateData,
      });

      // Progress workflow step
      const stepName = STATUS_TO_STEP[newStatus];
      if (stepName) {
        // Complete the previous step
        const currentStepName = STATUS_TO_STEP[currentStatus];
        if (currentStepName) {
          await prisma.workflowStep.updateMany({
            where: { requestId: id, name: currentStepName },
            data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
          });
        }

        // Start the new step
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: stepName },
          data: { status: 'WF_IN_PROGRESS' },
        });
      }

      // Audit entry
      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: `Status changed: ${currentStatus} → ${newStatus}`,
          performedBy: userId,
          details: dto.note || undefined,
          severity: newStatus === RightsRequestStatus.ESCALATED ? 'WARNING' : 'INFO',
        },
      });

      return updated;
    });
  }

  async assign(id: string, dto: AssignRequestDto, userId: string) {
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

  async getWorkflow(id: string) {
    await this.findOne(id);
    return this.prisma.workflowStep.findMany({
      where: { requestId: id },
      orderBy: { order: 'asc' },
    });
  }

  // ==========================================
  // PHASE 4: Sub-resources
  // ==========================================

  async getNotes(id: string) {
    await this.findOne(id);
    return this.prisma.caseNote.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNote(id: string, dto: CreateCaseNoteDto, userId: string) {
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

  async getAttachments(id: string) {
    await this.findOne(id);
    return this.prisma.caseAttachment.findMany({
      where: { requestId: id },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async addAttachment(id: string, dto: CreateCaseAttachmentDto, userId: string) {
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

  async getEvidence(id: string) {
    await this.findOne(id);
    return this.prisma.evidenceItem.findMany({
      where: { requestId: id },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async addEvidence(id: string, dto: CreateEvidenceItemDto, userId: string) {
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

  async getAuditTrail(id: string) {
    await this.findOne(id);
    return this.prisma.rightsAuditEntry.findMany({
      where: { requestId: id },
      orderBy: { performedAt: 'desc' },
    });
  }

  // ==========================================
  // PHASE 5: Metrics
  // ==========================================

  async getMetrics() {
    const [total, byStatus, byType, byPriority, slaBreached, closedRequests] = await Promise.all([
      this.prisma.rightsRequest.count(),
      this.prisma.rightsRequest.groupBy({ by: ['status'], _count: true }),
      this.prisma.rightsRequest.groupBy({ by: ['type'], _count: true }),
      this.prisma.rightsRequest.groupBy({ by: ['priority'], _count: true }),
      this.prisma.rightsRequest.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: [RightsRequestStatus.CLOSED, RightsRequestStatus.REJECTED] },
        },
      }),
      this.prisma.rightsRequest.findMany({
        where: {
          status: RightsRequestStatus.CLOSED,
          closedAt: { not: null },
        },
        select: { submittedAt: true, closedAt: true },
      }),
    ]);

    // Compute average resolution time in days
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

    const [
      byRegulation,
      byChannel,
      byVerification,
      monthlyRequests,
      topDataCategories,
    ] = await Promise.all([
      // Requests by regulation
      this.prisma.rightsRequest.groupBy({ by: ['regulation'], _count: true }),

      // Requests by submission channel
      this.prisma.rightsRequest.groupBy({ by: ['submissionChannel'], _count: true }),

      // Verification method distribution
      this.prisma.rightsRequest.groupBy({
        by: ['verificationMethod'],
        _count: true,
        where: { verificationMethod: { not: null } },
      }),

      // Monthly trend (last 12 months)
      this.prisma.rightsRequest.findMany({
        where: { submittedAt: { gte: twelveMonthsAgo } },
        select: { submittedAt: true, status: true },
      }),

      // All requests for data category analysis
      this.prisma.rightsRequest.findMany({
        select: { dataCategories: true },
      }),
    ]);

    // Build monthly trend
    const monthlyTrend: Record<string, { total: number; closed: number; escalated: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = { total: 0, closed: 0, escalated: 0 };
    }
    for (const r of monthlyRequests) {
      const key = `${r.submittedAt.getFullYear()}-${String(r.submittedAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].total++;
        if (r.status === 'CLOSED') monthlyTrend[key].closed++;
        if (r.status === 'ESCALATED') monthlyTrend[key].escalated++;
      }
    }

    // Flatten data categories and count frequency
    const categoryCount: Record<string, number> = {};
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

  // ==========================================
  // HELPERS
  // ==========================================

  private enrichWithSla(request: any) {
    const now = new Date();
    let slaBreached = false;
    let daysRemaining: number | null = null;

    if (request.dueDate) {
      const due = new Date(request.dueDate);
      const diffMs = due.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      slaBreached = diffMs < 0 && !['CLOSED', 'REJECTED'].includes(request.status);
    }

    return { ...request, slaBreached, daysRemaining };
  }
}
