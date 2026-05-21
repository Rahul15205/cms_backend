import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, AuditSeverity, AuditCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
// @ts-ignore
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EncryptionService } from '../encryption/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';

const PASSWORD_RESET_OTP_LENGTH = 7;
const PASSWORD_RESET_OTP_TTL_MINUTES = 10;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
    private encryptionService: EncryptionService,
    private notificationsService: NotificationsService
  ) {}

  private generatePasswordResetOtp(): string {
    let otp = '';
    for (let i = 0; i < PASSWORD_RESET_OTP_LENGTH; i++) {
      otp += PASSWORD_RESET_ALPHABET[crypto.randomInt(PASSWORD_RESET_ALPHABET.length)];
    }
    return otp;
  }

  private hashPasswordResetOtp(userId: string, otp: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${otp.trim().toUpperCase()}`)
      .digest('hex');
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const emailHash = this.encryptionService.generateHash(email);
    
    const user: any = await this.prisma.user.findUnique({
      where: { emailHash },
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

    // --- MFA CHECK ---
    if (user.mfaEnabled) {
      if (!loginDto.mfaToken) {
        return { mfaRequired: true, message: 'MFA token required' };
      }

      const secret = user.mfaSecret ? this.encryptionService.decrypt(user.mfaSecret) : null;
      if (!secret) throw new UnauthorizedException('MFA setup is incomplete');

      const isValid = authenticator.verify({ token: loginDto.mfaToken, secret });
      if (!isValid) {
        await this.auditLogsService.create({
          userId: user.id,
          action: 'Failed Login: Invalid MFA Token',
          category: 'SECURITY',
          severity: 'WARNING',
          tenantId: user.tenantId,
        });
        throw new UnauthorizedException('Invalid MFA token');
      }
    }
    // --- END MFA CHECK ---

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

    // --- SESSION HARDENING (Exceeding max concurrent sessions) ---
    // Max 3 concurrent sessions per user
    const maxSessions = 3;
    const activeSessions = await this.prisma.session.findMany({
      where: { userId: user.id, isCurrentSession: true },
      orderBy: { loginTime: 'asc' }, // Oldest first
    });

    if (activeSessions.length >= maxSessions) {
      // Invalidate oldest sessions until we're under the limit
      const sessionsToInvalidate = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
      const sessionIds = sessionsToInvalidate.map(s => s.id);
      
      if (sessionIds.length > 0) {
        await this.prisma.session.updateMany({
          where: { id: { in: sessionIds } },
          data: { isCurrentSession: false, refreshToken: null },
        });
        
        // Log the security event
        await this.auditLogsService.create({
          userId: user.id,
          action: 'Session Limit Exceeded: Oldest Session Terminated automatically',
          category: 'SECURITY',
          severity: 'WARNING',
          tenantId: user.tenantId,
        });
      }
    }

    const refreshToken = crypto.randomUUID();

    // Create new session record
    await this.prisma.session.create({
      data: {
        userId: user.id,
        loginTime: new Date(),
        lastActivity: new Date(),
        isCurrentSession: true,
        refreshToken,
      }
    });

    // Decrypt email for the token and response
    const decryptedEmail = this.encryptionService.decrypt(user.email);

    // Generate JWT
    const payload = { 
      sub: user.id, 
      email: decryptedEmail, 
      tenantId: user.tenantId 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: decryptedEmail,
        mustResetPassword: user.mustResetPassword,
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

  async generateMfaSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const email = this.encryptionService.decrypt(user.email);
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'Proteccio CMS', secret);

    await (this.prisma.user as any).update({
      where: { id: userId },
      data: { mfaSecret: this.encryptionService.encrypt(secret) },
    });

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  async verifyAndEnableMfa(userId: string, token: string) {
    const user: any = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new UnauthorizedException('MFA not setup');

    const secret = this.encryptionService.decrypt(user.mfaSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) throw new UnauthorizedException('Invalid MFA token');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA enabled successfully' };
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;

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

    const newRefreshToken = crypto.randomUUID();

    await this.prisma.session.update({
      where: { id: session.id },
      data: { 
        refreshToken: newRefreshToken,
        lastActivity: new Date()
      }
    });

    const decryptedEmail = this.encryptionService.decrypt(session.user.email);

    const payload = { 
      sub: session.user.id, 
      email: decryptedEmail, 
      tenantId: session.user.tenantId 
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: decryptedEmail,
        mustResetPassword: session.user.mustResetPassword,
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
    await this.prisma.session.updateMany({
      where: { userId, isCurrentSession: true },
      data: { isCurrentSession: false, refreshToken: null },
    });

    return { message: 'Logged out successfully. All sessions invalidated.' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.trim().toLowerCase();
    const emailHash = this.encryptionService.generateHash(email);
    const user = await this.prisma.user.findUnique({ where: { emailHash } });

    const response = {
      message: 'If an active account exists for this email, a password reset OTP has been sent.',
    };

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.auditLogsService.create({
        action: 'Password Reset Requested',
        category: 'SECURITY',
        severity: 'INFO',
        details: { email, result: 'No active account' },
      });
      return response;
    }

    const otp = this.generatePasswordResetOtp();
    const otpHash = this.hashPasswordResetOtp(user.id, otp);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetOtpExpiresAt: expiresAt,
        passwordResetOtpRequestedAt: new Date(),
        passwordResetOtpAttempts: 0,
      },
    });

    const decryptedEmail = this.encryptionService.decrypt(user.email);
    const sent = await this.notificationsService.sendPasswordResetOtp(
      decryptedEmail,
      user.name,
      otp,
      PASSWORD_RESET_OTP_TTL_MINUTES,
    );

    await this.auditLogsService.create({
      userId: user.id,
      action: sent ? 'Password Reset OTP Sent' : 'Password Reset OTP Email Failed',
      category: 'SECURITY',
      severity: sent ? 'INFO' : 'WARNING',
      tenantId: user.tenantId,
    });

    if (!sent) {
      throw new BadRequestException('Unable to send password reset OTP right now');
    }

    return response;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const email = resetPasswordDto.email.trim().toLowerCase();
    const otp = resetPasswordDto.otp.trim().toUpperCase();
    const emailHash = this.encryptionService.generateHash(email);
    const user: any = await this.prisma.user.findUnique({ where: { emailHash } });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt ||
      new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if ((user.passwordResetOtpAttempts || 0) >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many invalid OTP attempts. Please request a new OTP.');
    }

    const otpHash = this.hashPasswordResetOtp(user.id, otp);
    if (otpHash !== user.passwordResetOtpHash) {
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { passwordResetOtpAttempts: (user.passwordResetOtpAttempts || 0) + 1 },
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    const isSamePassword = await bcrypt.compare(resetPasswordDto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as your current password');
    }

    const hashedNewPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        mustResetPassword: false,
        passwordResetOtpHash: null,
        passwordResetOtpExpiresAt: null,
        passwordResetOtpRequestedAt: null,
        passwordResetOtpAttempts: 0,
      },
    });

    await this.prisma.session.updateMany({
      where: { userId: user.id, isCurrentSession: true },
      data: { isCurrentSession: false, refreshToken: null },
    });

    await this.auditLogsService.create({
      userId: user.id,
      action: 'Password Reset Successfully',
      category: 'SECURITY',
      severity: 'INFO',
      tenantId: user.tenantId,
    });

    return { message: 'Password reset successfully' };
  }

  async verifyResetOtp(verifyResetOtpDto: VerifyResetOtpDto) {
    const email = verifyResetOtpDto.email.trim().toLowerCase();
    const otp = verifyResetOtpDto.otp.trim().toUpperCase();
    const emailHash = this.encryptionService.generateHash(email);
    const user: any = await this.prisma.user.findUnique({ where: { emailHash } });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt ||
      new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if ((user.passwordResetOtpAttempts || 0) >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many invalid OTP attempts. Please request a new OTP.');
    }

    const otpHash = this.hashPasswordResetOtp(user.id, otp);
    if (otpHash !== user.passwordResetOtpHash) {
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { passwordResetOtpAttempts: (user.passwordResetOtpAttempts || 0) + 1 },
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully' };
  }

  async getProfile(userId: string) {
    const user: any = await this.prisma.user.findUnique({
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
      email: this.encryptionService.decrypt(user.email),
      phone: user.phone ? this.encryptionService.decrypt(user.phone) : null,
      status: user.status,
      accountType: user.accountType,
      department: user.department,
      mfaEnabled: user.mfaEnabled,
      aadhaarVerified: user.aadhaarVerified,
      lastLogin: user.lastLogin,
      mustResetPassword: user.mustResetPassword,
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

  async changePassword(userId: string, changePasswordDto: any) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as your temporary or current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        mustResetPassword: false,
      },
    });

    await this.auditLogsService.create({
      userId: user.id,
      action: 'Password Changed Successfully',
      category: 'SECURITY',
      severity: 'INFO',
      tenantId: user.tenantId,
    });

    return { message: 'Password changed successfully' };
  }
}
