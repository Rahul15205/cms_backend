import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get security events from audit logs (category = SECURITY).
   */
  async getEvents(tenantId?: string, limit = 50, offset = 0) {
    const where: any = { category: 'SECURITY' };
    if (tenantId) where.tenantId = tenantId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Login activity chart data — logins per day over last N days.
   */
  async getLoginActivity(tenantId?: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const [sessions, failedAudits] = await Promise.all([
      this.prisma.session.findMany({
        where: {
          loginTime: { gte: since },
          ...(tenantId ? { user: { tenantId } } : {}),
        },
        select: { loginTime: true },
      }),
      this.prisma.auditLog.findMany({
        where: {
          category: 'SECURITY',
          action: { contains: 'failed', mode: 'insensitive' },
          createdAt: { gte: since },
          ...(tenantId ? { tenantId } : {}),
        },
        select: { createdAt: true },
      }),
    ]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap: Record<string, { name: string; logins: number; failed: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      activityMap[key] = {
        name: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        logins: 0,
        failed: 0,
      };
    }

    sessions.forEach((s) => {
      const key = s.loginTime.toISOString().split('T')[0];
      if (activityMap[key]) activityMap[key].logins++;
    });

    failedAudits.forEach((f) => {
      const key = f.createdAt.toISOString().split('T')[0];
      if (activityMap[key]) activityMap[key].failed++;
    });

    return {
      chartData: Object.entries(activityMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([_, val]) => val),
      totalAttempts: sessions.length + failedAudits.length,
      failedAttempts: failedAudits.length,
    };
  }

  /**
   * Active sessions list with user info.
   */
  async getActiveSessions(tenantId?: string, limit = 50) {
    const where: any = { isCurrentSession: true };
    if (tenantId) {
      where.user = { tenantId };
    }

    const sessions = await this.prisma.session.findMany({
      where,
      take: Number(limit),
      orderBy: { lastActivity: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: {
              select: {
                role: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      user: s.user.email,
      role: (s.user.roles as any)[0]?.role?.name || 'User',
      device: s.device || 'Unknown Device',
      location: s.location || 'Unknown',
      ip: s.ipAddress,
      lastActive: s.lastActivity,
      deviceType: s.sessionType === 'MOBILE' ? 'mobile' : 'desktop',
    }));
  }
}
