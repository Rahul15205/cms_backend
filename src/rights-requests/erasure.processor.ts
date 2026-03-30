import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RightsRequestStatus, GrievanceStatus } from '@prisma/client';

export interface ErasureJobData {
  requestId: string;
}

@Processor('erasure')
export class ErasureProcessor extends WorkerHost {
  private readonly logger = new Logger(ErasureProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<ErasureJobData>): Promise<any> {
    const { requestId } = job.data;
    this.logger.log(`Processing erasure for request: ${requestId}`);

    const request = await this.prisma.rightsRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || !request.requesterEmail) {
      throw new Error(`Invalid erasure request: ${requestId}`);
    }

    const emailHash = request.requesterEmailHash || this.encryptionService.generateHash(request.requesterEmail);
    const phoneHash = request.requesterPhoneHash || (request.requesterPhone ? this.encryptionService.generateHash(request.requesterPhone) : null);

    try {
      // 1. Scrub Consent Records
      const consentUpdate = await this.prisma.consentRecord.updateMany({
        where: {
          OR: [
            { endUserEmailHash: emailHash },
            phoneHash ? { endUserPhoneHash: phoneHash } : undefined,
          ].filter(cond => cond !== undefined) as any
        },
        data: {
          endUserEmail: 'ANONYMIZED',
          endUserPhone: 'ANONYMIZED',
          endUserIp: '0.0.0.0',
          status: 'REVOKED',
          revokedAt: new Date(),
          metadata: { anonymized: true, erasureRequestId: requestId }
        }
      });
      this.logger.log(`Anonymized ${consentUpdate.count} consent records`);

      // 2. Scrub Grievances
      const grievanceUpdate = await this.prisma.grievance.updateMany({
        where: {
          OR: [
            { userEmailHash: emailHash },
          ] as any
        },
        data: {
          userEmail: 'ANONYMIZED',
          userName: 'ANONYMIZED',
          description: 'Contents scrubbed per Right to Erasure request.',
          subject: 'Anonymized Grievance',
          status: GrievanceStatus.RESOLVED
        }
      });
      this.logger.log(`Anonymized ${grievanceUpdate.count} grievances`);

      // 3. Notify User
      await this.notificationsService.sendErasureConfirmation(
        request.requesterEmail,
        request.requesterName,
        request.caseNumber
      );

      // 4. Create Fulfillment Note and Close Request
      await this.prisma.$transaction([
        this.prisma.caseNote.create({
          data: {
            requestId: requestId,
            content: `Automated erasure completed. Scrubbed records: Consents(${consentUpdate.count}), Grievances(${grievanceUpdate.count}).`,
            createdBy: 'SYSTEM-RTBF-PROCESSOR',
            type: 'NOTE_INTERNAL'
          }
        }),
        this.prisma.rightsRequest.update({
          where: { id: requestId },
          data: {
            status: RightsRequestStatus.CLOSED,
            closedAt: new Date()
          }
        })
      ]);

      this.logger.log(`Erasure request ${requestId} fulfilled successfully`);
      return { scrubbedConsents: consentUpdate.count, scrubbedGrievances: grievanceUpdate.count };
    } catch (error) {
      this.logger.error(`Erasure failed for ${requestId}: ${error.message}`);
      throw error;
    }
  }
}
