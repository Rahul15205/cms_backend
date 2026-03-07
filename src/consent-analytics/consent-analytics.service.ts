import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentUsageStatus } from '@prisma/client';

@Injectable()
export class ConsentAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * GET /api/consent/usage-records — paginated list of consent usage records.
   */
  async getUsageRecords(filters: {
    templateId?: string;
    status?: ConsentUsageStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.templateId) where.templateId = filters.templateId;
    if (filters.status) where.consentStatus = filters.status;
    if (filters.search) {
      where.OR = [
        { userIdentifier: { contains: filters.search, mode: 'insensitive' } },
        { purposeMapped: { contains: filters.search, mode: 'insensitive' } },
        { systemApp: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.consentUsageRecord.count({ where }),
      this.prisma.consentUsageRecord.findMany({
        where,
        take,
        skip,
        orderBy: { consentDateTime: 'desc' },
        include: { template: { select: { id: true, title: true } } },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  /**
   * GET /api/consent/cross-app-usage — cross-application consent usage.
   */
  async getCrossAppUsage(filters: {
    templateId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.templateId) where.templateId = filters.templateId;
    if (filters.status) where.status = filters.status;

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.applicationUsage.count({ where }),
      this.prisma.applicationUsage.findMany({
        where,
        take,
        skip,
        orderBy: { lastValidation: 'desc' },
        include: { template: { select: { id: true, title: true } } },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  /**
   * GET /api/consent/analytics — aggregate consent analytics.
   */
  async getAnalytics() {
    const [
      totalTemplates,
      templatesByStatus,
      templatesByType,
      totalRecords,
      recordsByStatus,
      totalDeployments,
      deploymentsByStatus,
      usageByApp,
    ] = await Promise.all([
      this.prisma.consentTemplate.count(),
      this.prisma.consentTemplate.groupBy({ by: ['status'], _count: true }),
      this.prisma.consentTemplate.groupBy({ by: ['type'], _count: true }),
      this.prisma.consentRecord.count(),
      this.prisma.consentRecord.groupBy({ by: ['status'], _count: true }),
      this.prisma.consentDeployment.count(),
      this.prisma.consentDeployment.groupBy({ by: ['status'], _count: true }),
      this.prisma.applicationUsage.groupBy({ by: ['applicationType'], _count: true }),
    ]);

    return {
      templates: {
        total: totalTemplates,
        byStatus: Object.fromEntries(templatesByStatus.map((s) => [s.status, s._count])),
        byType: Object.fromEntries(templatesByType.map((t) => [t.type, t._count])),
      },
      records: {
        total: totalRecords,
        byStatus: Object.fromEntries(recordsByStatus.map((s) => [s.status, s._count])),
      },
      deployments: {
        total: totalDeployments,
        byStatus: Object.fromEntries(deploymentsByStatus.map((s) => [s.status, s._count])),
      },
      crossAppUsage: {
        byApplicationType: Object.fromEntries(usageByApp.map((a) => [a.applicationType, a._count])),
      },
    };
  }
}
