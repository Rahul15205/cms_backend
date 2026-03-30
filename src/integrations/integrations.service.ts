import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
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

    return paginate(data, total, Math.floor(skip / take) + 1, take);
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

  async getMetrics() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalIntegrations, connectedCount, failedCount, syncs] = await Promise.all([
      this.prisma.integration.count(),
      this.prisma.integration.count({ where: { status: IntegrationStatus.CONNECTED } }),
      this.prisma.integration.count({ where: { status: IntegrationStatus.ERROR } }),
      this.prisma.integrationSyncLog.findMany({
        where: { startedAt: { gte: sevenDaysAgo } },
        select: { startedAt: true },
      }),
    ]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap: Record<string, { name: string; calls: number }> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = {
        name: daysOfWeek[d.getDay()],
        calls: 0,
      };
    }

    syncs.forEach((s) => {
      const key = s.startedAt.toISOString().split('T')[0];
      if (trendMap[key]) trendMap[key].calls++;
    });

    const apiUsageData = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);

    return {
      totalIntegrations,
      connectedCount,
      failedCount,
      apiUsageData,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.integration.delete({ where: { id } });
  }
}
