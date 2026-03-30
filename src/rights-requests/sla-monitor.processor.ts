import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RightsRequestStatus, GrievanceStatus } from '@prisma/client';

@Processor('sla-monitor')
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
    const nearBreachThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // 1. Check for Pending/In-Review requests that are past due
    const breached = await this.prisma.rightsRequest.findMany({
      where: {
        status: { notIn: [RightsRequestStatus.CLOSED, RightsRequestStatus.REJECTED] },
        dueDate: { lte: now },
        slaAlertSent: false,
      },
    });

    for (const req of breached) {
      this.logger.warn(`SLA Breached for Rights Request: ${req.caseNumber}`);
      await this.sendAlert(req, false);
      await this.prisma.rightsRequest.update({
        where: { id: req.id },
        data: { slaAlertSent: true },
      });
    }

    // 2. Check for requests nearing breach (within 24h)
    const nearBreach = await this.prisma.rightsRequest.findMany({
      where: {
        status: { notIn: [RightsRequestStatus.CLOSED, RightsRequestStatus.REJECTED] },
        dueDate: { gt: now, lte: nearBreachThreshold },
        nearBreachAlertSent: false,
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
    // Currently Grievance model doesn't have a dueDate field in schema, 
    // but the alert flags were added. If we decide to use a fixed SLA 
    // (e.g. 7 days from creation), we can implement it here.
    // For now, we'll keep it as a placeholder as requested.
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
