import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, AuditSeverity, AuditCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        tenant: true
      }
    });

    if (!user) {
      // Log failed attempt
      await this.auditLogsService.create({
        action: 'Failed Login: User Not Found',
        category: 'SECURITY',
        severity: 'WARNING',
        details: { email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.auditLogsService.create({
        userId: user.id,
        action: 'Failed Login: Inactive User',
        category: 'SECURITY',
        severity: 'WARNING',
        tenantId: user.tenantId,
        details: { status: user.status }
      });
      throw new UnauthorizedException('User account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      await this.auditLogsService.create({
        userId: user.id,
        action: 'Failed Login: Invalid Password',
        category: 'SECURITY',
        severity: 'WARNING',
        tenantId: user.tenantId,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log successful login
    await this.auditLogsService.create({
      userId: user.id,
      action: 'Successful Login',
      category: 'SECURITY',
      severity: 'INFO',
      tenantId: user.tenantId,
    });

    const refreshToken = crypto.randomUUID();

    // Create session record
    await this.prisma.session.create({
      data: {
        userId: user.id,
        loginTime: new Date(),
        lastActivity: new Date(),
        isCurrentSession: true,
        refreshToken,
      }
    });

    // Generate JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      tenantId: user.tenantId 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(ur => ur.role.name),
        permissions: user.roles.reduce((acc, ur) => {
          ur.role.permissions.forEach(p => {
            acc[p.module] = {
              view: p.view || acc[p.module]?.view,
              create: p.create || acc[p.module]?.create,
              edit: p.edit || acc[p.module]?.edit,
              approve: p.approve || acc[p.module]?.approve,
              export: p.export || acc[p.module]?.export,
              configure: p.configure || acc[p.module]?.configure,
              admin: p.admin || acc[p.module]?.admin,
            };
          });
          return acc;
        }, {} as any),
        tenant: user.tenant.name
      }
    };
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

    // Find active session with this refresh token
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            roles: { include: { role: { include: { permissions: true } } } },
            tenant: true
          }
        }
      }
    });

    if (!session || !session.isCurrentSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    // Determine token rotation: invalidate old one and generate a new one
    const newRefreshToken = crypto.randomUUID();

    await this.prisma.session.update({
      where: { id: session.id },
      data: { 
        refreshToken: newRefreshToken,
        lastActivity: new Date()
      }
    });

    // Generate new JWT
    const payload = { 
      sub: session.user.id, 
      email: session.user.email, 
      tenantId: session.user.tenantId 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles.map(ur => ur.role.name),
        permissions: session.user.roles.reduce((acc, ur) => {
          ur.role.permissions.forEach(p => {
            acc[p.module] = {
              view: p.view || acc[p.module]?.view,
              create: p.create || acc[p.module]?.create,
              edit: p.edit || acc[p.module]?.edit,
              approve: p.approve || acc[p.module]?.approve,
              export: p.export || acc[p.module]?.export,
              configure: p.configure || acc[p.module]?.configure,
              admin: p.admin || acc[p.module]?.admin,
            };
          });
          return acc;
        }, {} as any),
        tenant: session.user.tenant.name
      }
    };
  }

  async logout(userId: string) {
    // Invalidate all current sessions for this user
    await this.prisma.session.updateMany({
      where: { userId, isCurrentSession: true },
      data: { isCurrentSession: false, refreshToken: null },
    });

    return { message: 'Logged out successfully. All sessions invalidated.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      accountType: user.accountType,
      department: user.department,
      mfaEnabled: user.mfaEnabled,
      lastLogin: user.lastLogin,
      roles: user.roles.map((ur) => ur.role.name),
      permissions: user.roles.reduce((acc, ur) => {
        ur.role.permissions.forEach((p) => {
          acc[p.module] = {
            view: p.view || acc[p.module]?.view,
            create: p.create || acc[p.module]?.create,
            edit: p.edit || acc[p.module]?.edit,
            approve: p.approve || acc[p.module]?.approve,
            export: p.export || acc[p.module]?.export,
            configure: p.configure || acc[p.module]?.configure,
            admin: p.admin || acc[p.module]?.admin,
          };
        });
        return acc;
      }, {} as any),
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
      },
    };
  }
}
