import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface ConsentReceiptJobData {
  recordId: string;
}

@Processor('consent-receipts')
export class ConsentReceiptProcessor extends WorkerHost {
  private readonly logger = new Logger(ConsentReceiptProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<ConsentReceiptJobData>): Promise<any> {
    const { recordId } = job.data;
    this.logger.log(`Generating consent receipt for record: ${recordId}`);

    const record = await this.prisma.consentRecord.findUnique({
      where: { id: recordId },
      include: {
        version: {
          include: {
            template: {
              include: {
                purposes: true,
                dataCategories: true
              }
            }
          }
        },
        application: true
      }
    });

    if (!record || !record.endUserEmail) {
      this.logger.warn(`Skipping receipt: Record ${recordId} not found or email missing.`);
      return;
    }

    const { version, application } = record;
    const template = version.template;

    const receiptData = {
      recordId: record.id,
      applicationName: application.name,
      templateTitle: template.title,
      versionNumber: version.versionNumber,
      grantedAt: record.grantedAt.toUTCString(),
      purposes: template.purposes.map(p => p.name).join(', ') || 'General processing',
      dataCategories: template.dataCategories.map(c => c.label).join(', ') || 'Standard identifiers'
    };

    const sent = await this.notificationsService.sendConsentReceipt(
      record.endUserEmail,
      record.userId || 'Valued User',
      receiptData
    );

    if (sent) {
      this.logger.log(`Consent receipt sent successfully for ${recordId}`);
    } else {
      this.logger.error(`Failed to send consent receipt for ${recordId}`);
    }

    return { sent };
  }
}
