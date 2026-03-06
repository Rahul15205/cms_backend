import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
      select: {
        id: true,
        device: true,
        browser: true,
        ipAddress: true,
        location: true,
        loginTime: true,
        lastActivity: true,
        isCurrentSession: true,
        sessionType: true,
      }
    });
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
