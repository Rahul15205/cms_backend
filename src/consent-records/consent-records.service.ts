import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentRecordDto } from './dto/create-consent-record.dto';
import { UpdateConsentRecordDto } from './dto/update-consent-record.dto';
import { ConsentStatus } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class ConsentRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    @InjectQueue('consent-receipts') private readonly receiptQueue: Queue,
  ) {}

  async create(createConsentRecordDto: CreateConsentRecordDto) {
    const { versionId, applicationId, userId, endUserEmail } = createConsentRecordDto;

    // Validate that either a userId or endUserEmail is provided for tracking
    if (!userId && !endUserEmail) {
      throw new BadRequestException('Consent records must track either an internal userId or an endUserEmail');
    }

    // Verify Deployment binding is Active
    const deployment = await this.prisma.consentDeployment.findUnique({
      where: {
        versionId_applicationId: { versionId, applicationId }
      }
    });

    if (!deployment || !deployment.isActive) {
      throw new BadRequestException('This consent version is not actively deployed to the specified application');
    }

    // Capture exact ingestion timestamp and generate hashes
    const recordPayload: any = {
      ...createConsentRecordDto,
      status: createConsentRecordDto.status || ConsentStatus.GRANTED,
      grantedAt: new Date(),
      endUserEmailHash: endUserEmail ? this.encryptionService.generateHash(endUserEmail) : null,
      endUserPhoneHash: createConsentRecordDto.endUserPhone ? this.encryptionService.generateHash(createConsentRecordDto.endUserPhone) : null,
    };

    if (recordPayload.status === ConsentStatus.REVOKED) {
      recordPayload.revokedAt = new Date();
    }

    const record = await this.prisma.consentRecord.create({
      data: recordPayload as any,
      include: {
        version: { include: { template: true } },
        application: true
      }
    });

    // Automatically create a Usage Record for analytics/traceability (enterprise flow spec 3.7)
    if (record.status === ConsentStatus.GRANTED) {
      await this.prisma.consentUsageRecord.create({
        data: {
          userIdentifier: record.userId || record.endUserEmail || 'anonymous',
          ipAddress: record.endUserIp || undefined,
          templateId: record.version.templateId,
          version: record.version.versionNumber.toString(),
          purposeMapped: record.version.template.title || 'General', // Fallback to general if no specific purpose title
          systemApp: record.application.name,
          consentDateTime: record.grantedAt,
          consentStatus: 'ACTIVE',
        }
      }).catch(err => {
        console.error('Failed to create automated usage record:', err);
        // We don't throw here to avoid failing the main consent capture
      });

      // Enqueue Consent Receipt Job (DPDP Section 6)
      if (record.endUserEmail) {
        await this.receiptQueue.add('generate-receipt', { recordId: record.id });
      }
    }

    return record;
  }

  async findAll(status?: ConsentStatus, versionId?: string, applicationId?: string, userId?: string, email?: string, limit?: number, offset?: number) {
    const where: any = {};
    if (status) where.status = status;
    if (versionId) where.versionId = versionId;
    if (applicationId) where.applicationId = applicationId;
    if (userId) where.userId = userId;
    if (email) {
      const emailHash = this.encryptionService.generateHash(email);
      where.OR = [
        { endUserEmail: { contains: email, mode: 'insensitive' } },
        { endUserEmailHash: emailHash }
      ];
    }

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

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const record = await this.prisma.consentRecord.findUnique({
      where: { id },
      include: {
        version: { include: { template: true } },
        application: true
      }
    });
    
    if (!record) throw new NotFoundException('Consent Record not found');
    return record;
  }

  async update(id: string, updateConsentRecordDto: UpdateConsentRecordDto) {
    const record = await this.findOne(id);
    const updateData: any = { ...updateConsentRecordDto };

    // Automatically timestamp revocations
    if (updateData.status === ConsentStatus.REVOKED && record.status !== ConsentStatus.REVOKED) {
      updateData.revokedAt = new Date();
    }

    return this.prisma.consentRecord.update({
      where: { id },
      data: updateData
    });
  }
}
