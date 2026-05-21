import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from '../common/dto/paginated-response.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserStatus } from '@prisma/client';

import { EncryptionService } from '../encryption/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';

const PASSWORD_RESET_OTP_LENGTH = 7;
const PASSWORD_RESET_OTP_TTL_MINUTES = 10;
const PASSWORD_RESET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateSecurePassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

function generatePasswordResetOtp(): string {
  let otp = '';
  for (let i = 0; i < PASSWORD_RESET_OTP_LENGTH; i++) {
    otp += PASSWORD_RESET_ALPHABET[crypto.randomInt(PASSWORD_RESET_ALPHABET.length)];
  }
  return otp;
}

function hashPasswordResetOtp(userId: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${otp.trim().toUpperCase()}`)
    .digest('hex');
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private notificationsService: NotificationsService
  ) { }

  async create(createUserDto: CreateUserDto, tenantId: string) {
    const { roles, password, ...userData } = createUserDto;
    const emailHash = this.encryptionService.generateHash(userData.email);
    const existing = await this.prisma.user.findUnique({ where: { emailHash } });
    if (existing) throw new ConflictException('Email already in use');

    const encryptedEmail = this.encryptionService.encrypt(userData.email);
    const encryptedPhone = userData.phone ? this.encryptionService.encrypt(userData.phone) : null;
    const phoneHash = userData.phone ? this.encryptionService.generateHash(userData.phone) : null;

    // Aadhaar handling (if present in DTO)
    const aadhaarRaw = (userData as any).aadhaarNumber;
    const encryptedAadhaar = aadhaarRaw ? this.encryptionService.encrypt(aadhaarRaw) : null;
    const aadhaarHash = aadhaarRaw ? this.encryptionService.generateHash(aadhaarRaw) : null;

    const tempPassword = password || generateSecurePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        email: encryptedEmail,
        emailHash: emailHash,
        phone: encryptedPhone,
        phoneHash: phoneHash,
        aadhaarNumber: encryptedAadhaar,
        aadhaarHash: aadhaarHash,
        tenantId,
        password: hashedPassword,
        mustResetPassword: true,
        roles: {
          create: roles.map(roleId => ({ roleId }))
        }
      },
      include: { roles: true }
    });

    // Send welcome email with credentials
    const loginUrl = process.env.FRONTEND_URL || 'https://app.prod.pdcmspd.protecciodata.co.in';
    await this.notificationsService.sendWelcomeCredentials(
      userData.email,
      userData.name,
      tempPassword,
      loginUrl
    );

    const decryptedUser = this.decryptUser(user);
    return {
      ...decryptedUser,
      tempPassword, // Return the temp password so the admin can see it in the success toast
    };
  }

  async findAll(filters?: {
    status?: UserStatus;
    tenantId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.search) {
      const searchHash = this.encryptionService.generateHash(filters.search);
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { emailHash: searchHash }, // Exact match
        { phoneHash: searchHash },
        { aadhaarHash: searchHash }
      ];
    }

    const take = filters?.limit ? Number(filters.limit) : 50;
    const skip = filters?.offset ? Number(filters.offset) : 0;
    const orderBy: any = filters?.sortBy ? { [filters.sortBy]: filters.sortOrder || 'desc' } : { createdAt: 'desc' };

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true, email: true, name: true, phone: true, status: true, accountType: true,
          department: true, mfaEnabled: true, lastLogin: true, validFrom: true,
          validUntil: true, tenantId: true, createdAt: true, updatedAt: true,
          roles: { include: { role: { select: { name: true } } } }
        }
      })
    ]);

    const enrichedData = data.map(u => this.decryptUser(u));

    return paginate(enrichedData, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        roles: { include: { role: { include: { permissions: true } } } }
      }
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return this.decryptUser(user);
  }

  private decryptUser(user: any) {
    if (!user) return user;
    return {
      ...user,
      email: this.encryptionService.decrypt(user.email),
      phone: user.phone ? this.encryptionService.decrypt(user.phone) : null,
      aadhaarNumber: user.aadhaarNumber ? this.encryptionService.decrypt(user.aadhaarNumber) : null,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { roles, password, ...data } = updateUserDto;

    // Check if user exists
    await this.findOne(id);

    const updateData: any = { ...data };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (roles) {
      // Delete existing roles and create new ones
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: roles.map((roleId) => ({ roleId })),
      };
    }

    if (data.email) {
      updateData.email = this.encryptionService.encrypt(data.email);
      updateData.emailHash = this.encryptionService.generateHash(data.email);
    }
    if (data.phone) {
      updateData.phone = this.encryptionService.encrypt(data.phone);
      updateData.phoneHash = this.encryptionService.generateHash(data.phone);
    }
    const aadhaarRaw = (data as any).aadhaarNumber;
    if (aadhaarRaw) {
      updateData.aadhaarNumber = this.encryptionService.encrypt(aadhaarRaw);
      updateData.aadhaarHash = this.encryptionService.generateHash(aadhaarRaw);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: { include: { role: { select: { name: true } } } } }
    });

    return this.decryptUser(updated);
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });

    if (
      status === UserStatus.DISABLED ||
      status === UserStatus.LOCKED ||
      status === UserStatus.SUSPENDED
    ) {
      await this.prisma.session.updateMany({
        where: { userId: user.id, isCurrentSession: true },
        data: { isCurrentSession: false, refreshToken: null },
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DISABLED }
    });
  }

  async endSessions(id: string) {
    await this.findOne(id);
    const result = await this.prisma.session.updateMany({
      where: { userId: id, isCurrentSession: true },
      data: { isCurrentSession: false, refreshToken: null },
    });

    return { message: 'All active sessions ended', count: result.count };
  }

  async resetMfa(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
      select: { id: true, mfaEnabled: true },
    });
  }

  async sendPasswordReset(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const email = this.encryptionService.decrypt(user.email);
    const otp = generatePasswordResetOtp();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);

    await (this.prisma.user as any).update({
      where: { id },
      data: {
        passwordResetOtpHash: hashPasswordResetOtp(user.id, otp),
        passwordResetOtpExpiresAt: expiresAt,
        passwordResetOtpRequestedAt: new Date(),
        passwordResetOtpAttempts: 0,
      },
    });

    const sent = await this.notificationsService.sendPasswordResetOtp(
      email,
      user.name,
      otp,
      PASSWORD_RESET_OTP_TTL_MINUTES,
    );

    if (!sent) {
      throw new Error('Unable to send password reset OTP right now');
    }

    return { message: 'Password reset OTP sent' };
  }
}
