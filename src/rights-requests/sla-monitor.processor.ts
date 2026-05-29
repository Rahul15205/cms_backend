import { Processor, WorkerHost } from '@nestjs/bullmq'; // PHASE 4 CHANGE
import { Logger } from '@nestjs/common'; // PHASE 4 CHANGE
import { Job } from 'bullmq'; // PHASE 4 CHANGE
import { PrismaService } from '../prisma/prisma.service'; // PHASE 4 CHANGE
import { NotificationsService } from '../notifications/notifications.service'; // PHASE 4 CHANGE
import { RightsRequestStatus } from '@prisma/client'; // PHASE 4 CHANGE

@Processor('sla-monitor') // PHASE 4 CHANGE
export class SlaMonitorProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaMonitorProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Running SLA Monitoring Job: ${job.id}`);
    
    await Promise.all([
      this.monitorRightsRequests(),
      this.monitorGrievances(),
    ]);

    return { timestamp: new Date(), status: 'success' };
  }

  private async monitorRightsRequests() {
    const now = new Date();
    // PHASE 4 CHANGE — 3 business days = 72 hours
    const nearBreachThreshold = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    // 1. Check for Pending/In-Review requests that are past due
    const breached = await this.prisma.rightsRequest.findMany({
      where: {
        status: { notIn: [RightsRequestStatus.COMPLETED, RightsRequestStatus.REJECTED] }, // PHASE 4 CHANGE
        dueDate: { lte: now },
        slaAlertSent: false,
        slaPausedAt: null, // PHASE 4 CHANGE — skip paused cases
      },
    });

    for (const req of breached) {
      this.logger.warn(`SLA Breached for Rights Request: ${req.caseNumber}`);
      await this.sendAlert(req, false);
      
      // PHASE 4 CHANGE — set slaBreached flag atomically
      await this.prisma.rightsRequest.update({
        where: { id: req.id },
        data: {
          slaAlertSent: true,
          slaBreached: true,
          slaBreachedAt: new Date(),
        },
      });
    }

    // 2. Check for requests nearing breach (within 72h)
    const nearBreach = await this.prisma.rightsRequest.findMany({
      where: {
        status: { notIn: [RightsRequestStatus.COMPLETED, RightsRequestStatus.REJECTED] }, // PHASE 4 CHANGE
        dueDate: { gt: now, lte: nearBreachThreshold },
        nearBreachAlertSent: false,
        slaPausedAt: null, // PHASE 4 CHANGE — skip paused cases
      },
    });

    for (const req of nearBreach) {
      this.logger.log(`Near SLA Breach for Rights Request: ${req.caseNumber}`);
      await this.sendAlert(req, true);
      await this.prisma.rightsRequest.update({
        where: { id: req.id },
        data: { nearBreachAlertSent: true },
      });
    }
  }

  private async monitorGrievances() {
    // Placeholder for grievance SLA monitoring
  }

  private async sendAlert(request: any, isNearBreach: boolean) {
    const adminEmail = process.env.DPO_EMAIL || 'admin@example.com';
    const now = new Date();
    const due = new Date(request.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    await this.notificationsService.sendSLABreachAlert(adminEmail, {
      caseNumber: request.caseNumber,
      dueDate: due.toLocaleDateString(),
      daysRemaining,
      requestType: request.type,
      priority: request.priority,
      status: request.status,
      isNearBreach,
    });
  }
}
