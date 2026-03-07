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

    return {
      totalActiveConsents,
      expiredWithdrawnConsents,
      pendingRights,
      openGrievances,
      slaBreaches,
      totalUsers,
      totalRoles,
      activeNotices,
    };
  }

  /**
   * Chart data — returns aggregated data by type.
   */
  async getChartData(type: string, tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    switch (type) {
      case 'consent-status': {
        const data = await this.prisma.consentRecord.groupBy({
          by: ['status'],
          _count: true,
        });
        return { type, data: data.map((d) => ({ label: d.status, count: d._count })) };
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
}
