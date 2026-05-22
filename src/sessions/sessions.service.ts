import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { resolveLocationFromIp } from '../common/utils/request-meta.utils';

const sessionInclude = {
  user: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  private mapSession(session: {
    id: string;
    userId: string;
    device: string | null;
    browser: string | null;
    ipAddress: string | null;
    location: string | null;
    loginTime: Date;
    lastActivity: Date;
    isCurrentSession: boolean;
    sessionType: string;
    user?: { id: string; name: string; email: string } | null;
  }) {
    let userName = 'Unknown User';
    if (session.user) {
      if (session.user.name?.trim()) {
        userName = session.user.name.trim();
      } else if (session.user.email) {
        try {
          userName = this.encryptionService.decrypt(session.user.email);
        } catch {
          userName = 'Unknown User';
        }
      }
    }

    const ipAddress = session.ipAddress?.trim() || null;
    const location =
      session.location?.trim() ||
      resolveLocationFromIp(ipAddress) ||
      null;

    return {
      id: session.id,
      userId: session.userId,
      userName,
      device: session.device || 'Desktop',
      browser: session.browser || '—',
      ipAddress: ipAddress || '—',
      location: location || '—',
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      isCurrentSession: session.isCurrentSession,
      sessionType: session.sessionType,
    };
  }

  async findAllForTenant(tenantId: string, limit = 200) {
    const sessions = await this.prisma.session.findMany({
      where: { user: { tenantId } },
      orderBy: { lastActivity: 'desc' },
      take: limit,
      include: sessionInclude,
    });
    return sessions.map((s) => this.mapSession(s));
  }

  async findAllForUser(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
      include: sessionInclude,
    });
    return sessions.map((s) => this.mapSession(s));
  }

  async remove(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only delete your own sessions');
    }

    return this.prisma.session.delete({ where: { id } });
  }
}
