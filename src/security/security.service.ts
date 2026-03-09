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
  async getLoginActivity(tenantId?: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: any = {
      loginTime: { gte: since },
      ...(tenantId ? { user: { tenantId } } : {}),
    };

    const sessions = await this.prisma.session.findMany({
      where,
      select: { loginTime: true },
      orderBy: { loginTime: 'asc' },
    });

    // Group by date
    const activityMap: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = s.loginTime.toISOString().split('T')[0];
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });

    return Object.entries(activityMap).map(([date, count]) => ({ date, logins: count }));
  }

  /**
   * Active sessions list with user info.
   */
  async getActiveSessions(tenantId?: string, limit = 50) {
    const where: any = { isCurrentSession: true };
    if (tenantId) {
      where.user = { tenantId };
    }

    return this.prisma.session.findMany({
      where,
      take: Number(limit),
      orderBy: { lastActivity: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
