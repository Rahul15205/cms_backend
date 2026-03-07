import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationType, IntegrationStatus } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateIntegrationDto) {
    return this.prisma.integration.create({
      data: dto as any,
    });
  }

  async findAll(filters: {
    type?: IntegrationType;
    status?: IntegrationStatus;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.tenantId) where.tenantId = filters.tenantId;

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.integration.count({ where }),
      this.prisma.integration.findMany({
        where,
        take,
        skip,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { syncLogs: true } } },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  async findOne(id: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
      include: {
        syncLogs: { take: 10, orderBy: { startedAt: 'desc' } },
      },
    });
    if (!integration) throw new NotFoundException('Integration not found');
    return integration;
  }

  async update(id: string, dto: UpdateIntegrationDto) {
    await this.findOne(id);
    return this.prisma.integration.update({
      where: { id },
      data: dto as any,
    });
  }

  /**
   * Connect an integration — sets status to CONNECTED.
   */
  async connect(id: string) {
    const integration = await this.findOne(id);
    if (integration.status === IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Integration is already connected');
    }

    return this.prisma.integration.update({
      where: { id },
      data: {
        status: IntegrationStatus.CONNECTED,
        errorMessage: null,
      },
    });
  }

  /**
   * Disconnect an integration — sets status to DISCONNECTED.
   */
  async disconnect(id: string) {
    const integration = await this.findOne(id);
    if (integration.status === IntegrationStatus.DISCONNECTED) {
      throw new BadRequestException('Integration is already disconnected');
    }

    return this.prisma.integration.update({
      where: { id },
      data: { status: IntegrationStatus.DISCONNECTED },
    });
  }

  /**
   * Trigger a sync for an integration — creates a sync log entry.
   */
  async sync(id: string) {
    const integration = await this.findOne(id);
    if (integration.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException('Cannot sync: integration is not connected');
    }

    // Create sync log entry
    const syncLog = await this.prisma.integrationSyncLog.create({
      data: {
        integrationId: id,
        syncType: 'manual',
        status: 'success',
        recordsSynced: 0,
        completedAt: new Date(),
      },
    });

    // Update integration's lastSync and increment apiCalls
    await this.prisma.integration.update({
      where: { id },
      data: {
        lastSync: new Date(),
        apiCalls: { increment: 1 },
      },
    });

    return { message: 'Sync completed', syncLog };
  }

  /**
   * Get sync logs for an integration.
   */
  async getSyncLogs(id: string, limit = 20) {
    await this.findOne(id);
    return this.prisma.integrationSyncLog.findMany({
      where: { integrationId: id },
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.integration.delete({ where: { id } });
  }
}
