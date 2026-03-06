import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentRecordDto } from './dto/create-consent-record.dto';
import { UpdateConsentRecordDto } from './dto/update-consent-record.dto';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ConsentRecordsService {
  constructor(private prisma: PrismaService) {}

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

    // Capture exact ingestion timestamp
    const recordPayload: any = {
      ...createConsentRecordDto,
      status: createConsentRecordDto.status || ConsentStatus.GRANTED,
      grantedAt: new Date()
    };

    if (recordPayload.status === ConsentStatus.REVOKED) {
      recordPayload.revokedAt = new Date();
    }

    return this.prisma.consentRecord.create({
      data: recordPayload as any
    });
  }

  async findAll(status?: ConsentStatus, versionId?: string, applicationId?: string, userId?: string, email?: string, limit?: number, offset?: number) {
    const where: any = {};
    if (status) where.status = status;
    if (versionId) where.versionId = versionId;
    if (applicationId) where.applicationId = applicationId;
    if (userId) where.userId = userId;
    if (email) where.endUserEmail = { contains: email, mode: 'insensitive' };

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
