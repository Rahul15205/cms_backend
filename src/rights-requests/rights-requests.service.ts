import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRightsRequestDto } from './dto/create-rights-request.dto';
import { UpdateRightsRequestDto } from './dto/update-rights-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { CreateCaseAttachmentDto } from './dto/create-case-attachment.dto';
import { CreateEvidenceItemDto } from './dto/create-evidence-item.dto';
import { RightsRequestStatus, RejectionReason, RightsRequest, ReportType } from '@prisma/client';
import { WorkflowTemplateService } from './workflow-template.service'; // PHASE 2 CHANGE
import { RejectRequestDto, EscalateRequestDto, RequestMoreInfoDto, PartialFulfilmentDto } from './dto/quick-actions.dto'; // PHASE 3 CHANGE
import { SlaRuleService } from './sla-rule.service'; // PHASE 4 CHANGE

// PHASE 1 CHANGE — Valid status transitions (new 9-state machine)
const STATUS_TRANSITIONS: Record<RightsRequestStatus, RightsRequestStatus[]> = {
  [RightsRequestStatus.RECEIVED]:           [RightsRequestStatus.IN_VERIFICATION, RightsRequestStatus.REJECTED],   // PHASE 1 CHANGE
  [RightsRequestStatus.IN_VERIFICATION]:    [RightsRequestStatus.IN_REVIEW, RightsRequestStatus.REJECTED],         // PHASE 1 CHANGE
  [RightsRequestStatus.IN_REVIEW]:          [RightsRequestStatus.ACTION_TAKEN, RightsRequestStatus.ON_HOLD, RightsRequestStatus.REJECTED, RightsRequestStatus.ESCALATED], // PHASE 1 CHANGE
  [RightsRequestStatus.ON_HOLD]:            [RightsRequestStatus.IN_REVIEW, RightsRequestStatus.REJECTED],         // PHASE 1 CHANGE
  [RightsRequestStatus.ACTION_TAKEN]:       [RightsRequestStatus.COMPLETED, RightsRequestStatus.PARTIAL_FULFILMENT, RightsRequestStatus.IN_REVIEW], // PHASE 1 CHANGE
  [RightsRequestStatus.PARTIAL_FULFILMENT]: [RightsRequestStatus.COMPLETED, RightsRequestStatus.IN_REVIEW],        // PHASE 1 CHANGE
  [RightsRequestStatus.ESCALATED]:          [RightsRequestStatus.IN_REVIEW, RightsRequestStatus.ACTION_TAKEN, RightsRequestStatus.REJECTED], // PHASE 1 CHANGE
  [RightsRequestStatus.COMPLETED]:          [],                                                                     // PHASE 1 CHANGE
  [RightsRequestStatus.REJECTED]:           [],                                                                     // PHASE 1 CHANGE
};

// PHASE 1 CHANGE — Map status to workflow step name for auto-progression
const STATUS_TO_STEP: Partial<Record<RightsRequestStatus, string>> = {
  RECEIVED: 'Received',
  IN_VERIFICATION: 'In Verification',   // PHASE 1 CHANGE
  IN_REVIEW: 'In Review',
  ACTION_TAKEN: 'Action Taken',
  COMPLETED: 'Completed',              // PHASE 1 CHANGE
};

import { StorageService } from '../common/storage/storage.service';
import { EncryptionService } from '../encryption/encryption.service';

import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class RightsRequestsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private encryptionService: EncryptionService,
    private notificationsService: NotificationsService,
    private reportsService: ReportsService,
    @InjectQueue('sla-monitor') private slaQueue: Queue,
    @InjectQueue('erasure') private erasureQueue: Queue,
    private readonly workflowTemplateService: WorkflowTemplateService, // PHASE 2 CHANGE
    private readonly slaRuleService: SlaRuleService // PHASE 4 CHANGE
  ) {}

  async onModuleInit() {
    // Schedule the SLA monitoring job to run every 15 minutes (PHASE 4 CHANGE)
    await this.slaQueue.add('check-sla', {}, {
      repeat: {
        pattern: '*/15 * * * *', // PHASE 4 CHANGE
      },
      removeOnComplete: true,
      jobId: 'hourly-sla-check'
    });
  }

  // ==========================================
  // PHASE 2: Core CRUD
  // ==========================================

  async create(dto: CreateRightsRequestDto, userId: string) {
    const { dueDate, tenantId, ...rest } = dto;

    // PHASE 4 CHANGE — Resolve SLA Rule and calculate due date dynamically
    const slaRule = await this.slaRuleService.getRule(
      dto.regulation,
      dto.type,
      tenantId || ''
    );
    const resolvedDueDate = dueDate ? new Date(dueDate) : this.slaRuleService.calculateDueDate(new Date(), slaRule.slaDays);
    const resolvedPriority = slaRule.priority;

    // Generate case number: RR-{YEAR}-{PADDED_SEQ}
    const year = new Date().getFullYear();
    const count = await this.prisma.rightsRequest.count({
      where: {
        caseNumber: { startsWith: `RR-${year}-` },
      },
    });
    const caseNumber = `RR-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (prisma) => {
      // Encrypt and Hash PII
      const encryptedEmail = this.encryptionService.encrypt(rest.requesterEmail);
      const emailHash = this.encryptionService.generateHash(rest.requesterEmail);
      const encryptedPhone = rest.requesterPhone ? this.encryptionService.encrypt(rest.requesterPhone) : null;
      const phoneHash = rest.requesterPhone ? this.encryptionService.generateHash(rest.requesterPhone) : null;
      
      // Handle Aadhaar if present in DTO (might need update to DTO later)
      const aadhaarRaw = (rest as any).aadhaarNumber;
      const encryptedAadhaar = aadhaarRaw ? this.encryptionService.encrypt(aadhaarRaw) : null;
      const aadhaarHash = aadhaarRaw ? this.encryptionService.generateHash(aadhaarRaw) : null;

      // Create the request
      const request = await prisma.rightsRequest.create({
        data: {
          ...rest,
          requesterEmail: encryptedEmail,
          requesterEmailHash: emailHash,
          requesterPhone: encryptedPhone,
          requesterPhoneHash: phoneHash,
          aadhaarNumber: encryptedAadhaar,
          aadhaarHash: aadhaarHash,
          caseNumber,
          dataCategories: rest.dataCategories || [],
          relatedConsents: rest.relatedConsents || [],
          relatedApplications: rest.relatedApplications || [],
          dueDate: resolvedDueDate,
          priority: resolvedPriority,
          tenantId,
          currentStep: 'Received',
        },
      });

      // PHASE 2 CHANGE — Fetch dynamic steps based on type and regulation
      const templateSteps = await this.workflowTemplateService.getTemplate(
        rest.type,
        rest.regulation,
        tenantId || ''
      );

      const steps = templateSteps.map(step => ({
        name:        step.name,
        order:       step.order,
        assignedRole: step.assignedRole,
        slaHours:    step.slaHours,
        templateStepId: step.id ?? null,
        status:      'WF_NOT_STARTED',
      }));

      // Auto-create workflow steps
      await prisma.workflowStep.createMany({
        data: steps.map((step) => ({
          requestId: request.id,
          name: step.name,
          order: step.order,
          assignedRole: step.assignedRole,
          slaHours: step.slaHours,
          templateStepId: step.templateStepId,
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

      // 4. Trigger Notifications (Async)
      this.notificationsService.sendRightsRequestConfirmation(
        rest.requesterEmail!,
        rest.requesterName,
        caseNumber,
        rest.type,
        rest.regulation
      );

      // Alert Admin (DPO)
      const adminEmail = process.env.DPO_EMAIL || 'admin@example.com'; 
      this.notificationsService.sendNewRightsRequestAlert(adminEmail, {
        caseNumber,
        requesterName: rest.requesterName,
        requestType: rest.type,
        regulation: rest.regulation,
        priority: rest.priority || 'NORMAL',
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
      const searchHash = this.encryptionService.generateHash(filters.search);
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { requesterName: { contains: filters.search, mode: 'insensitive' } },
        { requesterEmailHash: searchHash }, // Exact match via blind index
        { requesterPhoneHash: searchHash },
        { aadhaarHash: searchHash },
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

    // Compute SLA fields at query time and decrypt PII
    const enriched = data.map((r) => this.decryptRequest(this.enrichWithSla(r)));

    return paginate(enriched, total, Math.floor(skip / take) + 1, take);
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
    return this.decryptRequest(this.enrichWithSla(request));
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

    // PHASE 3 CHANGE — SLA resume on ON_HOLD → IN_REVIEW
    if (
      request.status === RightsRequestStatus.ON_HOLD &&
      newStatus === RightsRequestStatus.IN_REVIEW &&
      request.slaPausedAt
    ) {
      const pausedDuration = new Date().getTime() - request.slaPausedAt.getTime();
      const newDueDate = new Date(request.dueDate.getTime() + pausedDuration);
      await this.prisma.rightsRequest.update({
        where: { id },
        data: { dueDate: newDueDate, slaPausedAt: null }
      });
      request.dueDate = newDueDate;
      request.slaPausedAt = null;
    }

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

      if (newStatus === RightsRequestStatus.IN_REVIEW) { // PHASE 1 CHANGE — was ACKNOWLEDGED
        updateData.acknowledgedAt = new Date();
      }
      if (newStatus === RightsRequestStatus.COMPLETED || newStatus === RightsRequestStatus.REJECTED) { // PHASE 1 CHANGE — CLOSED→COMPLETED
        updateData.closedAt = new Date();
        updateData.completedAt = new Date(); // PHASE 1 CHANGE
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

      // 4. Trigger Status Update Notification
      this.notificationsService.sendRightsRequestStatusUpdate(
        request.requesterEmail!,
        request.requesterName,
        request.caseNumber,
        request.type,
        newStatus,
        dto.note
      );

      // 5. Automatic DSAR Fulfillment (Access/Portability)
      if (
        newStatus === RightsRequestStatus.ACTION_TAKEN &&
        ['ACCESS', 'PORTABILITY'].includes(request.type)
      ) {
        await this.reportsService.create({
          name: `DSAR Data Pack: ${request.caseNumber}`,
          reportType: ReportType.DSAR_EXPORT,
          format: 'JSON',
          parameters: {
            email: request.requesterEmail,
            phone: request.requesterPhone,
            requestId: id,
          },
          tenantId: request.tenantId,
        }, userId);
      }

      // 6. Automatic Erasure (Right to be Forgotten)
      if (
        newStatus === RightsRequestStatus.ACTION_TAKEN &&
        request.type === 'ERASURE'
      ) {
        await this.erasureQueue.add('process-erasure', { requestId: id });
      }

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

  async addEvidence(id: string, dto: CreateEvidenceItemDto, userId: string, file?: Express.Multer.File) {
    const request = await this.findOne(id);

    let fileName = dto.fileName;
    let fileType = dto.fileType;
    let size = dto.size;

    if (file) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const cloudPath = `evidence/${file.fieldname}-${uniqueSuffix}${ext}`;
      
      // Upload to Supabase
      await this.storageService.uploadFile(cloudPath, file.buffer, file.mimetype);
      
      fileName = cloudPath; // Store the cloud path/URL
      fileType = ext.replace('.', '') || file.mimetype.split('/')[1] || 'unknown';
      
      const bytes = file.size;
      const mb = bytes / (1024 * 1024);
      if (mb >= 1) {
        size = `${mb.toFixed(2)} MB`;
      } else {
        const kb = bytes / 1024;
        size = `${Math.ceil(kb)} KB`;
      }
    }

    const evidence = await this.prisma.evidenceItem.create({
      data: {
        requestId: id,
        caseNumber: request.caseNumber,
        fileName: fileName || 'unknown',
        fileType: fileType || 'unknown',
        category: dto.category,
        uploadedBy: userId,
        size: size || '0 KB',
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

  async verifyEvidence(requestId: string, id: string, verified: boolean, userId: string) {
    const request = await this.findOne(requestId);
    
    const evidence = await this.prisma.evidenceItem.update({
      where: { id },
      data: { verified },
    });

    await this.prisma.rightsAuditEntry.create({
      data: {
        requestId,
        caseNumber: request.caseNumber,
        action: 'Evidence Verification Updated',
        performedBy: userId,
        details: `Evidence ${evidence.fileName} status changed to ${verified ? 'Verified' : 'Pending'}`,
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

  async getAllEvidence() {
    return this.prisma.evidenceItem.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getGlobalAuditTrail() {
    return this.prisma.rightsAuditEntry.findMany({
      orderBy: { performedAt: 'desc' },
      take: 100, // Limit global audit to last 100 items for performance
    });
  }

  // ==========================================
  // PHASE 5: Metrics
  // ==========================================

  async getMetrics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      byStatus,
      byType,
      byPriority,
      slaBreached,
      closedRequests,
      newToday,
      newThisWeek
    ] = await Promise.all([
      this.prisma.rightsRequest.count(),
      this.prisma.rightsRequest.groupBy({ by: ['status'], _count: true }),
      this.prisma.rightsRequest.groupBy({ by: ['type'], _count: true }),
      this.prisma.rightsRequest.groupBy({ by: ['priority'], _count: true }),
      this.prisma.rightsRequest.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: [RightsRequestStatus.COMPLETED, RightsRequestStatus.REJECTED] }, // PHASE 1 CHANGE — CLOSED→COMPLETED
        },
      }),
      this.prisma.rightsRequest.findMany({
        where: {
          status: RightsRequestStatus.COMPLETED, // PHASE 1 CHANGE — CLOSED→COMPLETED
          closedAt: { not: null },
        },
        select: { submittedAt: true, closedAt: true },
      }),
      this.prisma.rightsRequest.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.rightsRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
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

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    const typeMap = Object.fromEntries(byType.map((t) => [t.type, t._count]));

    // Get repeat requests
    const repeats = await this.prisma.rightsRequest.groupBy({
      by: ['requesterEmail'],
      _count: true,
      having: {
        requesterEmail: { _count: { gt: 1 } }
      }
    });

    const metrics = {
      total,
      newToday,
      newThisWeek,
      pending: total - (statusMap[RightsRequestStatus.COMPLETED] || 0) - (statusMap[RightsRequestStatus.REJECTED] || 0), // PHASE 1 CHANGE — CLOSED→COMPLETED
      completed: statusMap[RightsRequestStatus.COMPLETED] || 0, // PHASE 1 CHANGE — CLOSED→COMPLETED
      rejected: statusMap[RightsRequestStatus.REJECTED] || 0,
      slaCompliance: total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100,
      slaBreaches: slaBreached,
      avgResolutionDays,
      fulfilmentRate: total > 0 ? Math.round(((statusMap[RightsRequestStatus.COMPLETED] || 0) / total) * 100) : 100, // PHASE 1 CHANGE — CLOSED→COMPLETED
      repeatRequests: repeats.length,
    };

    // Map backend types to frontend lowercase keys
    const breakdown: Record<string, number> = {
      file_complaint: typeMap['FILE_COMPLAINT'] || 0,
      withdraw_consent: typeMap['WITHDRAW_CONSENT'] || 0,
      access: typeMap['ACCESS'] || 0,
      correction: typeMap['CORRECTION'] || 0,
      erasure: typeMap['ERASURE'] || 0,
      grievance_redressal: typeMap['GRIEVANCE_REDRESSAL'] || 0,
      nominate: typeMap['NOMINATE'] || 0,
    };

    const typeColors: Record<string, string> = {
      ACCESS: 'hsl(217, 91%, 50%)',
      CORRECTION: 'hsl(142, 76%, 36%)',
      ERASURE: 'hsl(0, 72%, 51%)',
      WITHDRAW_CONSENT: 'hsl(38, 92%, 50%)',
      FILE_COMPLAINT: 'hsl(12, 76%, 61%)',
      GRIEVANCE_REDRESSAL: 'hsl(262, 83%, 58%)',
      NOMINATE: 'hsl(199, 89%, 48%)',
    };

    const breakdownChart = byType.map((t) => ({
      name: t.type.charAt(0) + t.type.slice(1).toLowerCase().replace(/_/g, ' '),
      value: t._count,
      color: typeColors[t.type] || 'hsl(215, 16%, 47%)',
    }));

    // Weekly trend by type (last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const weeklyTrends = await this.prisma.rightsRequest.findMany({
      where: { createdAt: { gte: fourWeeksAgo } },
      select: { createdAt: true, type: true },
    });

    const trendData: any[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const name = `Week ${4 - i}`;
      const entry: any = { name, access: 0, correction: 0, erasure: 0, file_complaint: 0, withdraw_consent: 0, grievance_redressal: 0, nominate: 0 };
      
      const weekStart = new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekEnd = d;

      weeklyTrends.forEach((r) => {
        if (r.createdAt >= weekStart && r.createdAt <= weekEnd) {
          const typeKey = r.type.toLowerCase() as keyof typeof entry;
          if (entry[typeKey] !== undefined) (entry[typeKey] as number)++;
        }
      });
      trendData.push(entry);
    }

    // Requests by regulation
    const byReg = await this.prisma.rightsRequest.groupBy({ 
      by: ['regulation'], 
      _count: true 
    });

    const regulationColors: Record<string, string> = {
      GDPR: 'hsl(217, 91%, 50%)',
      DPDP: 'hsl(142, 76%, 36%)',
      CCPA: 'hsl(262, 83%, 58%)',
      LGPD: 'hsl(38, 92%, 50%)',
      CUSTOM: 'hsl(215, 16%, 47%)',
      TAPA: 'hsl(199, 89%, 48%)',
      PDPL: 'hsl(12, 76%, 61%)',
      PIPL: 'hsl(180, 70%, 40%)',
    };

    const regulationBreakdown = byReg.map(r => ({
      name: r.regulation,
      value: r._count,
      color: regulationColors[r.regulation] || 'hsl(215, 16%, 47%)'
    }));

    // Workflow Status
    // PHASE 1 CHANGE — updated status references
    const workflowStatus = [
      { stage: "Received", count: statusMap[RightsRequestStatus.RECEIVED] || 0, color: "bg-muted-foreground" },
      { stage: "Verification", count: statusMap[RightsRequestStatus.IN_VERIFICATION] || 0, color: "bg-info" },      // PHASE 1 CHANGE
      { stage: "In Review", count: statusMap[RightsRequestStatus.IN_REVIEW] || 0, color: "bg-warning" },
      { stage: "Action Taken", count: statusMap[RightsRequestStatus.ACTION_TAKEN] || 0, color: "bg-primary" },
      { stage: "Completed", count: statusMap[RightsRequestStatus.COMPLETED] || 0, color: "bg-success" },             // PHASE 1 CHANGE
    ];

    // SLA by Priority
    const priorities = ['CRITICAL', 'URGENT', 'NORMAL']; // Match prisma enum
    const slaByPriority = await Promise.all(priorities.map(async (p) => {
      const count = await this.prisma.rightsRequest.count({ where: { priority: p as any } });
      const breached = await this.prisma.rightsRequest.count({ 
        where: { 
          priority: p as any,
          dueDate: { lt: new Date() },
          status: { notIn: [RightsRequestStatus.COMPLETED, RightsRequestStatus.REJECTED] } // PHASE 1 CHANGE — CLOSED→COMPLETED
        } 
      });
      const percentage = count > 0 ? Math.round(((count - breached) / count) * 100) : 100;
      return { level: p.charAt(0) + p.slice(1).toLowerCase(), count, breached, percentage };
    }));

    return {
      metrics,
      breakdown,
      breakdownChart,
      regulationBreakdown,
      workflowStatus,
      slaByPriority,
      trendData,
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

    // Build monthly trend with per-regulation counts
    const monthlyTrend: Record<string, any> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = { total: 0, gdpr: 0, dpdp: 0, ccpa: 0, lgpd: 0 };
    }
    for (const r of monthlyRequests) {
      const key = `${r.submittedAt.getFullYear()}-${String(r.submittedAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].total++;
        // Approximate mapping to regulation keys
        const reg = (r as any).regulation?.toLowerCase();
        if (reg && monthlyTrend[key][reg] !== undefined) {
          monthlyTrend[key][reg]++;
        }
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

    // Map regulation metrics to frontend structure
    const regulationMetricsMap: Record<string, any> = {
      GDPR: { total: 0, fulfilled: 0, rejected: 0, pending: 0, avgDays: 0, slaCompliance: 100 },
      DPDP: { total: 0, fulfilled: 0, rejected: 0, pending: 0, avgDays: 0, slaCompliance: 100 },
      CCPA: { total: 0, fulfilled: 0, rejected: 0, pending: 0, avgDays: 0, slaCompliance: 100 },
      LGPD: { total: 0, fulfilled: 0, rejected: 0, pending: 0, avgDays: 0, slaCompliance: 100 },
      PDPL: { total: 0, fulfilled: 0, rejected: 0, pending: 0, avgDays: 0, slaCompliance: 100 },
    };

    byRegulation.forEach((r) => {
      if (regulationMetricsMap[r.regulation]) {
        regulationMetricsMap[r.regulation].total = r._count;
      }
    });

    // Monthly trend in frontend format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrend = Object.entries(monthlyTrend).map(([key, data]) => {
      const [year, month] = key.split('-');
      return {
        name: monthNames[parseInt(month) - 1],
        total: data.total,
        gdpr: data.gdpr,
        dpdp: data.dpdp,
        ccpa: data.ccpa,
        lgpd: data.lgpd,
      };
    });

    // Type distribution in frontend format
    const typeColors: Record<string, string> = {
      ACCESS: 'hsl(217, 91%, 50%)',
      CORRECTION: 'hsl(142, 76%, 36%)',
      ERASURE: 'hsl(0, 72%, 51%)',
      PORTABILITY: 'hsl(262, 83%, 58%)',
      OTHER: 'hsl(38, 92%, 50%)',
    };

    const typeDistribution = (await this.prisma.rightsRequest.groupBy({ by: ['type'], _count: true })).map((t) => ({
      name: t.type.charAt(0) + t.type.slice(1).toLowerCase(),
      value: t._count,
      color: typeColors[t.type] || 'hsl(200, 10%, 50%)',
    }));

    // Get metrics for summary
    const metricsResult = await this.getMetrics();
    const { metrics } = metricsResult;

    return {
      summary: {
        fulfilmentRate: metrics.fulfilmentRate,
        avgResolutionDays: metrics.avgResolutionDays,
        totalSlaBreaches: metrics.slaBreaches,
        repeatRequests: metrics.repeatRequests,
      },
      regulationMetrics: Object.entries(regulationMetricsMap).map(([reg, data]) => ({ regulation: reg, ...data })),
      monthlyTrend: formattedTrend,
      typeDistribution: metricsResult.breakdownChart,
      applicationRisks: [], // Mock or aggregate from relatedApplications
      repeatRequesters: [], // Mock for now
      fulfilmentByType: metricsResult.breakdownChart.map(t => ({ name: t.name, value: 95 })), // Approximation
      abuseIndicators: [],
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
      slaBreached = diffMs < 0 && !['COMPLETED', 'REJECTED'].includes(request.status); // PHASE 1 CHANGE — CLOSED→COMPLETED
    }

    return { ...request, slaBreached, daysRemaining };
  }

  // ==========================================
  // PHASE 3: Quick Actions — PHASE 3 CHANGE
  // ==========================================

  // PHASE 3 CHANGE
  async approve(id: string, userId: string): Promise<RightsRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;

    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(RightsRequestStatus.ACTION_TAKEN)) {
      throw new BadRequestException(`Invalid status transition: ${currentStatus} → ACTION_TAKEN`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updateData: any = {
        status: RightsRequestStatus.ACTION_TAKEN,
        currentStep: STATUS_TO_STEP[RightsRequestStatus.ACTION_TAKEN] || 'Action Taken',
      };
      if (!request.completedAt) {
        updateData.completedAt = new Date();
      }

      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: updateData,
      });

      const currentStepName = STATUS_TO_STEP[currentStatus];
      if (currentStepName) {
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: currentStepName },
          data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
        });
      }

      const nextStepName = STATUS_TO_STEP[RightsRequestStatus.ACTION_TAKEN];
      if (nextStepName) {
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: nextStepName },
          data: { status: 'WF_IN_PROGRESS' },
        });
      }

      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: 'Request approved',
          performedBy: userId,
          performedAt: new Date(),
          severity: 'INFO',
          details: 'Status changed to ACTION_TAKEN',
        },
      });

      try {
        this.notificationsService.sendRightsRequestStatusUpdate(
          request.requesterEmail!,
          request.requesterName,
          request.caseNumber,
          request.type,
          RightsRequestStatus.ACTION_TAKEN
        );
      } catch (e) {
        // failed notification must NOT roll back the status update
      }

      if (request.type === 'ERASURE') {
        try {
          await this.erasureQueue.add('process-erasure', { requestId: id });
        } catch (e) {}
      }

      if (['ACCESS', 'PORTABILITY'].includes(request.type as string)) {
        try {
          await this.reportsService.create({
            name: `DSAR Data Pack: ${request.caseNumber}`,
            reportType: ReportType.DSAR_EXPORT,
            format: 'JSON',
            parameters: {
              email: request.requesterEmail,
              phone: request.requesterPhone,
              requestId: id,
            },
            tenantId: request.tenantId,
          }, userId);
        } catch (e) {}
      }

      return updated;
    });
  }

  // PHASE 3 CHANGE
  async reject(id: string, dto: RejectRequestDto, userId: string): Promise<RightsRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;

    if (!dto.reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(RightsRequestStatus.REJECTED)) {
      throw new BadRequestException(`Invalid status transition: ${currentStatus} → REJECTED`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: {
          status: RightsRequestStatus.REJECTED,
          rejectionReason: dto.reason,
          rejectionComment: dto.comment || null,
          closedAt: new Date(),
        },
      });

      const currentStepName = STATUS_TO_STEP[currentStatus];
      if (currentStepName) {
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: currentStepName },
          data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
        });
      }

      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: `Request rejected — ${dto.reason}`,
          performedBy: userId,
          performedAt: new Date(),
          severity: 'WARNING',
          details: dto.comment || `Request rejected. Reason: ${dto.reason}`,
        },
      });

      try {
        this.notificationsService.sendRightsRequestStatusUpdate(
          request.requesterEmail!,
          request.requesterName,
          request.caseNumber,
          request.type,
          RightsRequestStatus.REJECTED,
          dto.comment
        );
      } catch (e) {}

      return updated;
    });
  }

  // PHASE 3 CHANGE
  async escalate(id: string, dto: EscalateRequestDto, userId: string): Promise<RightsRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;

    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(RightsRequestStatus.ESCALATED)) {
      throw new BadRequestException(`Invalid status transition: ${currentStatus} → ESCALATED`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: {
          status: RightsRequestStatus.ESCALATED,
          escalatedTo: dto.target,
          escalationReason: dto.rationale,
        },
      });

      const currentStepName = STATUS_TO_STEP[currentStatus];
      if (currentStepName) {
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: currentStepName },
          data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
        });
      }

      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: `Case escalated to ${dto.target}`,
          performedBy: userId,
          performedAt: new Date(),
          severity: 'WARNING',
          details: dto.rationale,
        },
      });

      try {
        const escalationEmail = process.env.DPO_EMAIL || 'admin@example.com';
        this.notificationsService.sendNewRightsRequestAlert(escalationEmail, {
          caseNumber: request.caseNumber,
          requesterName: request.requesterName,
          requestType: request.type,
          regulation: request.regulation,
          priority: request.priority,
        });
      } catch (e) {}

      return updated;
    });
  }

  // PHASE 3 CHANGE
  async requestMoreInfo(id: string, dto: RequestMoreInfoDto, userId: string): Promise<RightsRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;

    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(RightsRequestStatus.ON_HOLD)) {
      throw new BadRequestException(`Invalid status transition: ${currentStatus} → ON_HOLD`);
    }

    // PHASE 4 CHANGE
    const slaRule = await this.slaRuleService.getRule(
      request.regulation,
      request.type,
      request.tenantId || ''
    );
    const shouldPause = slaRule.clockPauseOnHold;

    return this.prisma.$transaction(async (prisma) => {
      const updateData: any = {
        status: RightsRequestStatus.ON_HOLD,
      };
      if (shouldPause) {
        updateData.slaPausedAt = new Date();
      }

      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: updateData,
      });

      await prisma.caseNote.create({
        data: {
          requestId: id,
          content: dto.message,
          createdBy: userId,
          type: 'NOTE_EXTERNAL',
        },
      });

      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: 'Request More Info sent',
          performedBy: userId,
          performedAt: new Date(),
          severity: 'INFO',
          details: `SLA ${shouldPause ? 'paused' : 'continues'} — regulation: ${request.regulation}`,
        },
      });

      try {
        this.notificationsService.sendRightsRequestStatusUpdate(
          request.requesterEmail!,
          request.requesterName,
          request.caseNumber,
          request.type,
          RightsRequestStatus.ON_HOLD,
          dto.message
        );
      } catch (e) {}

      return updated;
    });
  }

  // PHASE 3 CHANGE
  async partialFulfil(id: string, dto: PartialFulfilmentDto, userId: string): Promise<RightsRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RightsRequestStatus;

    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(RightsRequestStatus.PARTIAL_FULFILMENT)) {
      throw new BadRequestException(`Invalid status transition: ${currentStatus} → PARTIAL_FULFILMENT`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const partialFulfilmentJson = {
        fulfilled: dto.fulfilled,
        withheld: dto.withheld,
        justification: dto.legalJustification,
        recordedBy: userId,
        recordedAt: new Date().toISOString(),
      };

      const updated = await prisma.rightsRequest.update({
        where: { id },
        data: {
          status: RightsRequestStatus.PARTIAL_FULFILMENT,
          partialFulfilment: partialFulfilmentJson,
        },
      });

      const currentStepName = STATUS_TO_STEP[currentStatus];
      if (currentStepName) {
        await prisma.workflowStep.updateMany({
          where: { requestId: id, name: currentStepName },
          data: { status: 'WF_COMPLETED', completedAt: new Date(), completedBy: userId },
        });
      }

      await prisma.rightsAuditEntry.create({
        data: {
          requestId: id,
          caseNumber: request.caseNumber,
          action: 'Partial fulfilment recorded',
          performedBy: userId,
          performedAt: new Date(),
          severity: 'INFO',
          details: `Fulfilled: ${dto.fulfilled}, Withheld: ${dto.withheld}. Justification: ${dto.legalJustification}`,
        },
      });

      try {
        this.notificationsService.sendRightsRequestStatusUpdate(
          request.requesterEmail!,
          request.requesterName,
          request.caseNumber,
          request.type,
          RightsRequestStatus.PARTIAL_FULFILMENT,
          `Partial Fulfilment recorded. Justification: ${dto.legalJustification}`
        );
      } catch (e) {}

      return updated;
    });
  }

  // PHASE 3 CHANGE
  async generateExtract(id: string, userId: string): Promise<{ jobId: string }> {
    const request = await this.findOne(id);

    if (!['ACCESS', 'PORTABILITY', 'ERASURE'].includes(request.type as string)) {
      throw new BadRequestException('Request type must be ACCESS, PORTABILITY, or ERASURE to generate extract');
    }

    const job = await this.erasureQueue.add('generate-dsar-extract', { requestId: id, requestedBy: userId });

    await this.prisma.rightsAuditEntry.create({
      data: {
        requestId: id,
        caseNumber: request.caseNumber,
        action: 'Data extract job triggered',
        performedBy: userId,
        performedAt: new Date(),
        severity: 'INFO',
        details: `Triggered extract job. Job ID: ${job.id}`,
      },
    });

    return { jobId: job.id! };
  }

  private decryptRequest(request: any) {
    if (!request) return request;
    return {
      ...request,
      requesterEmail: this.encryptionService.decrypt(request.requesterEmail),
      requesterPhone: request.requesterPhone ? this.encryptionService.decrypt(request.requesterPhone) : null,
      aadhaarNumber: request.aadhaarNumber ? this.encryptionService.decrypt(request.aadhaarNumber) : null,
    };
  }
}
