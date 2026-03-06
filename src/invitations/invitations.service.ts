import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationStatus } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(createInvitationDto: CreateInvitationDto, inviterId: string, tenantId: string) {
    const { email, roleId } = createInvitationDto;
    
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if pending invitation exists
    const existingInv = await this.prisma.invitation.findFirst({
      where: { email, status: InvitationStatus.PENDING }
    });
    if (existingInv) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    // Default expiration: 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.invitation.create({
      data: {
        email,
        roleId,
        invitedBy: inviterId,
        tenantId,
        expiresAt,
        status: InvitationStatus.PENDING
      },
      include: { role: { select: { name: true } }, inviter: { select: { name: true, email: true } } }
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.invitation.findMany({
      where,
      include: { role: { select: { name: true } }, inviter: { select: { name: true } } },
      orderBy: { invitedAt: 'desc' }
    });
  }

  async resend(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation not found');
    
    // Re-issue expiration for 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.invitation.update({
      where: { id },
      data: { expiresAt, status: InvitationStatus.PENDING }
    });
  }

  async remove(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation not found');
    
    return this.prisma.invitation.delete({ where: { id } });
  }
}
