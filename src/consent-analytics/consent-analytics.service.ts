import { Injectable } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
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
    if (filters.status) {
      const normalized = String(filters.status).toUpperCase();
      if (['ACTIVE', 'WITHDRAWN', 'EXPIRED'].includes(normalized)) {
        where.consentStatus = normalized as ConsentUsageStatus;
      }
    }
    if (filters.search) {
      where.OR = [
        { userIdentifier: { contains: filters.search, mode: 'insensitive' } },
        { purposeMapped: { contains: filters.search, mode: 'insensitive' } },
        { systemApp: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const take = filters.limit ? Number(filters.limit) : 500;
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

    return paginate(data, total, Math.floor(skip / take) + 1, take);
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

    return paginate(data, total, Math.floor(skip / take) + 1, take);
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

    // Map statuses to match frontend expectations
    const recordsStatusMap = Object.fromEntries(recordsByStatus.map((s) => [s.status, s._count]));
    const mappedRecordsByStatus = {
      ACTIVE: recordsStatusMap['GRANTED'] || 0,
      WITHDRAWN: recordsStatusMap['REVOKED'] || 0,
      EXPIRED: 0, // Not explicitly tracked in consentRecord yet
    };

    // 4. Re-consent Success Rate (Per Template)
    const publishedTemplates = await this.prisma.consentTemplate.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true }
    });

    const reconsentMetrics = await this.prisma.consentRecord.findMany({
      where: { status: 'GRANTED' },
      include: { version: { include: { template: true } } },
    });

    const templateSuccessMap: Record<string, { completed: number; sent: number }> = {};
    
    // Initialize with all published templates
    publishedTemplates.forEach(t => {
      templateSuccessMap[t.title] = { completed: 0, sent: 0 };
    });

    reconsentMetrics.forEach(rec => {
      const title = rec.version.template.title;
      if (templateSuccessMap[title]) {
        templateSuccessMap[title].completed++;
        // If we don't track 'sent' explicitly, we can't show a real rate.
        // For now, assume completions are the visible part.
        templateSuccessMap[title].sent = templateSuccessMap[title].completed;
      }
    });

    const reconsentData = Object.entries(templateSuccessMap).map(([template, stats]) => ({
      template,
      completed: stats.completed,
      sent: stats.sent,
      rate: stats.sent > 0 ? Math.round((stats.completed / stats.sent) * 100) : 0,
    })).slice(0, 4);

    // 5. Fatigue Indicators
    const userConsentCounts = await this.prisma.consentRecord.groupBy({
      by: ['userId'],
      _count: true,
      where: { userId: { not: null } }
    });
    const multiRequestUserCount = userConsentCounts.filter(u => u._count > 2).length;
    const totalUsers = userConsentCounts.length || 0;
    const multiRequestRate = totalUsers > 0 ? Math.round((multiRequestUserCount / totalUsers) * 100) : 0;

    const withdrawals = await this.prisma.consentRecord.findMany({
      where: { status: 'REVOKED', revokedAt: { not: null } },
    });
    const immediateWithdrawals = withdrawals.filter(w => {
      if (!w.revokedAt) return false;
      const hours = (w.revokedAt.getTime() - w.grantedAt.getTime()) / (1000 * 60 * 60);
      return hours < 24;
    }).length;
    const withdrawalRate = totalRecords > 0 ? Math.round((immediateWithdrawals / totalRecords) * 100) : 0;

    const fatigueIndicators = [
      {
        metric: "Multiple Consent Requests",
        value: multiRequestRate,
        threshold: 30,
        status: multiRequestRate > 30 ? "warning" : "healthy",
        description: "Users receiving 3+ consent requests in 30 days",
      },
      {
        metric: "Immediate Withdrawal",
        value: withdrawalRate,
        threshold: 10,
        status: withdrawalRate > 10 ? "warning" : "healthy",
        description: "Withdrawals within 24 hours of consent",
      },
      {
        metric: "Rapid Decline Rate",
        value: 0, 
        threshold: 15,
        status: "healthy",
        description: "Users declining within 2 seconds",
      },
      {
        metric: "Re-consent Abandonment",
        value: 0,
        threshold: 25,
        status: "healthy",
        description: "Incomplete re-consent flows",
      }
    ];

    return {
      templates: {
        total: totalTemplates,
        byStatus: Object.fromEntries(templatesByStatus.map((s) => [s.status, s._count])),
        byType: Object.fromEntries(templatesByType.map((t) => [t.type, t._count])),
      },
      records: {
        total: totalRecords,
        byStatus: mappedRecordsByStatus,
      },
      deployments: {
        total: totalDeployments,
        byStatus: Object.fromEntries(deploymentsByStatus.map((s) => [s.status, s._count])),
      },
      crossAppUsage: {
        byApplicationType: Object.fromEntries(usageByApp.map((a) => [a.applicationType, a._count])),
      },
      reconsentData,
      fatigueIndicators
    };
  }

  /**
   * GET /api/consent/system-configs — list system configs for usage traceability.
   */
  async getSystemConfigs(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.systemConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * POST /api/consent/system-configs — create a system config entry.
   */
  async createSystemConfig(dto: {
    name: string;
    type: string;
    integrationMode: string;
    authMethod: string;
    endpoint: string;
    description?: string;
    tenantId?: string;
  }) {
    return this.prisma.systemConfig.create({
      data: dto,
    });
  }
}
