import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EncryptionService } from '../encryption/encryption.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as otplib from 'otplib';

jest.mock('bcrypt');
jest.mock('otplib', () => ({
  authenticator: {
    verify: jest.fn(),
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: any;
  let auditLogsService: any;
  let encryptionService: any;

  const mockPrismaService = () => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  });

  const mockJwtService = () => ({
    sign: jest.fn(),
  });

  const mockAuditLogsService = () => ({
    create: jest.fn(),
  });

  const mockEncryptionService = () => ({
    generateHash: jest.fn((val) => `hash_${val}`),
    encrypt: jest.fn((val) => `enc_${val}`),
    decrypt: jest.fn((val) => val.replace('enc_', '')),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
        { provide: EncryptionService, useFactory: mockEncryptionService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    auditLogsService = module.get(AuditLogsService);
    encryptionService = module.get(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return mfaRequired if MFA is enabled but no token provided', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'enc_test@example.com',
        password: 'hashedpassword',
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
        mfaSecret: 'enc_secret',
        tenantId: 'tenant-1',
        roles: [],
        tenant: { name: 'Acme' }
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result: any = await authService.login(loginDto);
      expect(result.mfaRequired).toBe(true);
    });

    it('should throw UnauthorizedException if MFA token is invalid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'enc_test@example.com',
        password: 'hashedpassword',
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
        mfaSecret: 'enc_secret',
        tenantId: 'tenant-1',
        roles: [],
        tenant: { name: 'Acme' }
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ((otplib as any).authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(authService.login({ ...loginDto, mfaToken: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('should enforce session hardening by invalidating oldest sessions', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'enc_test@example.com',
        password: 'hashedpassword',
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
        tenantId: 'tenant-1',
        roles: [{ role: { name: 'admin', permissions: [] } }],
        tenant: { name: 'Acme' }
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Mock 3 existing sessions
      prismaService.session.findMany.mockResolvedValue([
        { id: 's1', isCurrentSession: true },
        { id: 's2', isCurrentSession: true },
        { id: 's3', isCurrentSession: true },
      ]);

      await authService.login(loginDto);

      // Should have called updateMany to invalidate sessions
      expect(prismaService.session.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: { in: ['s1'] } }
      }));
    });
  });
});
