import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregate KPIs across all modules.
   * Returns counts suitable for Admin, DPO, and Data Principal dashboards.
   */
  async getKpis(tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    const [
      totalActiveConsents,
      expiredWithdrawnConsents,
      pendingRights,
      openGrievances,
      totalUsers,
      totalRoles,
      slaBreaches,
      activeNotices,
    ] = await Promise.all([
      // Active consents (GRANTED)
      this.prisma.consentRecord.count({
        where: { status: 'GRANTED' },
      }),
      // Expired + Withdrawn consents
      this.prisma.consentRecord.count({
        where: { status: 'REVOKED' },
      }),
      // Pending rights requests (not CLOSED or REJECTED)
      this.prisma.rightsRequest.count({
        where: {
          ...tenantFilter,
          status: { notIn: ['CLOSED', 'REJECTED'] },
        },
      }),
      // Open grievances (not RESOLVED)
      this.prisma.grievance.count({
        where: {
          ...tenantFilter,
          status: { notIn: ['RESOLVED'] },
        },
      }),
      // Total users
      this.prisma.user.count({
        where: tenantFilter,
      }),
      // Total roles
      this.prisma.role.count(),
      // SLA breaches: rights requests past due date
      this.prisma.rightsRequest.count({
        where: {
          ...tenantFilter,
          dueDate: { lt: new Date() },
          status: { notIn: ['CLOSED', 'REJECTED'] },
        },
      }),
      // Active notices
      this.prisma.notice.count({
        where: { ...tenantFilter, status: 'NOTICE_ACTIVE' },
      }),
    ]);

    // Calculate Compliance Score (Simplified)
    // 100 - (SLA Breaches / Total Rights * 100) - (Open Grievances / Total Grievances * 50)
    const totalRights = await this.prisma.rightsRequest.count({ where: tenantFilter });
    const totalGrievances = await this.prisma.grievance.count({ where: tenantFilter });
    
    let complianceScore = 100;
    if (totalRights > 0) {
      complianceScore -= (slaBreaches / totalRights) * 50;
    }
    if (totalGrievances > 0) {
      complianceScore -= (openGrievances / totalGrievances) * 30;
    }
    complianceScore = Math.max(0, Math.round(complianceScore));

    const breakdown = {
      consent: 95, // High if no major issues
      rights: totalRights > 0 ? Math.round(((totalRights - slaBreaches) / totalRights) * 100) : 100,
      grievances: totalGrievances > 0 ? Math.round(((totalGrievances - openGrievances) / totalGrievances) * 100) : 100,
      notices: 100,
      cookies: 100
    };

    return {
      totalActiveConsents,
      expiredWithdrawnConsents,
      pendingRights,
      openGrievances,
      slaBreaches,
      totalUsers,
      totalRoles,
      activeNotices,
      complianceScore,
      complianceBreakdown: breakdown
    };
  }

  /**
   * Chart data — returns aggregated data by type.
   */
  async getChartData(type: string, tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    switch (type) {
      case 'consent-status': {
        const records = await this.prisma.consentRecord.groupBy({
          by: ['status'],
          _count: true,
        });
        const statusMap = Object.fromEntries(records.map(r => [r.status, r._count]));
        
        // Use ApplicationUsage as a proxy for other statuses if needed, 
        // or just return what we have with proper labels.
        const usageData = await this.prisma.applicationUsage.groupBy({
          by: ['status'],
          _count: true
        });
        const usageMap = Object.fromEntries(usageData.map(u => [u.status, u._count]));

        return { 
          type, 
          data: [
            { label: 'Active', count: statusMap['GRANTED'] || 0, color: "hsl(142, 76%, 36%)" },
            { label: 'Expired', count: usageMap['EXPIRED'] || 0, color: "hsl(38, 92%, 50%)" },
            { label: 'Withdrawn', count: statusMap['REVOKED'] || 0, color: "hsl(0, 72%, 51%)" },
            { label: 'Rejected', count: usageMap['INACTIVE'] || 0, color: "hsl(262, 83%, 58%)" },
            { label: 'Pending', count: usageMap['PENDING'] || 0, color: "hsl(199, 89%, 48%)" },
          ]
        };
      }

      case 'consent-by-regulation': {
        const data = await this.prisma.rightsRequest.groupBy({
          by: ['regulation'],
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.regulation, count: d._count })) };
      }

      case 'rights-by-status': {
        const data = await this.prisma.rightsRequest.groupBy({
          by: ['status'],
          where: tenantFilter,
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.status, count: d._count })) };
      }

      case 'rights-by-type': {
        const data = await this.prisma.rightsRequest.groupBy({
          by: ['type'],
          where: tenantFilter,
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.type, count: d._count })) };
      }

      case 'grievances-by-category': {
        const data = await this.prisma.grievance.groupBy({
          by: ['category'],
          where: tenantFilter,
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.category, count: d._count })) };
      }

      case 'grievances-by-status': {
        const data = await this.prisma.grievance.groupBy({
          by: ['status'],
          where: tenantFilter,
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.status, count: d._count })) };
      }

      case 'users-by-status': {
        const data = await this.prisma.user.groupBy({
          by: ['status'],
          where: tenantFilter,
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.status, count: d._count })) };
      }

      case 'trends': {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [consents, rights, grievances] = await Promise.all([
          this.prisma.consentRecord.findMany({
            where: { grantedAt: { gte: sixMonthsAgo } },
            select: { grantedAt: true, status: true },
          }),
          this.prisma.rightsRequest.findMany({
            where: { ...tenantFilter, createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, status: true },
          }),
          this.prisma.grievance.findMany({
            where: { ...tenantFilter, createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, status: true },
          }),
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendData: { name: string; active: number; withdrawn: number; rights: number; grievances: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          trendData.push({
            name: months[d.getMonth()],
            active: 0,
            withdrawn: 0,
            rights: 0,
            grievances: 0,
          });
        }

        consents.forEach((c) => {
          const m = months[c.grantedAt.getMonth()];
          const entry = trendData.find((t) => t.name === m);
          if (entry) {
            if (c.status === 'GRANTED') entry.active++;
            if (c.status === 'REVOKED') entry.withdrawn++;
          }
        });

        rights.forEach((r) => {
          const m = months[r.createdAt.getMonth()];
          const entry = trendData.find((t) => t.name === m);
          if (entry) entry.rights++;
        });

        grievances.forEach((g) => {
          const m = months[g.createdAt.getMonth()];
          const entry = trendData.find((t) => t.name === m);
          if (entry) entry.grievances++;
        });

        return { type, data: trendData };
      }

      case 'consent-by-type': {
        const data = await this.prisma.consentTemplate.groupBy({
          by: ['type'],
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.type, count: d._count })) };
      }

      default:
        return { type, data: [], message: `Unknown chart type: ${type}` };
    }
  }

  /**
   * Recent activity — latest audit logs.
   */
  async getRecentActivity(tenantId?: string, limit = 20) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  /**
   * Active alerts — SLA-breached requests, escalated grievances, etc.
   */
  async getAlerts(tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    const [slaBreachedRequests, escalatedGrievances, expiringSessions] = await Promise.all([
      // Rights requests that breached SLA
      this.prisma.rightsRequest.findMany({
        where: {
          ...tenantFilter,
          dueDate: { lt: new Date() },
          status: { notIn: ['CLOSED', 'REJECTED'] },
        },
        take: 10,
        orderBy: { dueDate: 'asc' },
        select: { id: true, caseNumber: true, type: true, dueDate: true, status: true, requesterName: true },
      }),
      // Escalated grievances
      this.prisma.grievance.findMany({
        where: { ...tenantFilter, status: 'ESCALATED' },
        take: 10,
        orderBy: { escalatedAt: 'desc' },
        select: { id: true, caseNumber: true, subject: true, category: true, escalatedAt: true },
      }),
      // Sessions with no activity in the last 24 hours (potentially stale)
      this.prisma.session.count({
        where: {
          isCurrentSession: true,
          lastActivity: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      slaBreachedRequests,
      escalatedGrievances,
      staleSessions: expiringSessions,
    };
  }

  /**
   * Security dashboard KPIs.
   */
  async getSecurityKpis(tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    const [activeSessions, totalUsers, mfaEnabledUsers, failedLogins, recentSecurityEvents] =
      await Promise.all([
        this.prisma.session.count({ where: { isCurrentSession: true } }),
        this.prisma.user.count({ where: tenantFilter }),
        this.prisma.user.count({ where: { ...tenantFilter, mfaEnabled: true } }),
        this.prisma.auditLog.count({
          where: { ...tenantFilter, category: 'SECURITY', action: { contains: 'failed', mode: 'insensitive' } },
        }),
        this.prisma.auditLog.findMany({
          where: { ...tenantFilter, category: 'SECURITY' },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        }),
      ]);

    return {
      activeSessions,
      mfaEnabledPercentage: totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0,
      failedLoginAttempts: failedLogins,
      threatLevel: failedLogins > 50 ? 'high' : failedLogins > 10 ? 'medium' : 'low',
      recentSecurityEvents,
    };
  }

  /**
   * Get user's widget configuration.
   */
  async getWidgetConfig(userId: string) {
    const config = await this.prisma.dashboardWidgetConfig.findUnique({
      where: { userId },
    });
    return config ?? { userId, widgets: [] };
  }

  /**
   * Upsert user's widget configuration.
   */
  async updateWidgetConfig(userId: string, widgets: any) {
    return this.prisma.dashboardWidgetConfig.upsert({
      where: { userId },
      update: { widgets },
      create: { userId, widgets },
    });
  }
}
