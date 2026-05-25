import { Test, TestingModule } from '@nestjs/testing';
import { AadhaarService } from './aadhaar.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EncryptionService } from '../encryption/encryption.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AadhaarService', () => {
  let aadhaarService: AadhaarService;
  let prismaService: any;
  let cacheManager: any;
  let encryptionService: any;

  const mockPrismaService = () => ({
    user: {
      update: jest.fn(),
    },
    aadhaarConfig: {
      findUnique: jest.fn().mockResolvedValue({ enabled: true, consentText: 'I consent' }),
      findFirst: jest.fn().mockResolvedValue({ enabled: true }),
    },
  });

  const cacheStore = new Map<string, unknown>();
  const mockCacheManager = () => ({
    set: jest.fn((k: string, v: unknown) => {
      cacheStore.set(k, v);
      return v;
    }),
    get: jest.fn((k: string) => cacheStore.get(k)),
    del: jest.fn((k: string) => {
      cacheStore.delete(k);
    }),
  });

  const mockEncryptionService = () => ({
    generateHash: jest.fn((val) => `hash_${val}`),
    encrypt: jest.fn((val) => `enc_${val}`),
    decrypt: jest.fn((val) => val.replace('enc_', '')),
  });

  beforeEach(async () => {
    cacheStore.clear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AadhaarService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: CACHE_MANAGER, useFactory: mockCacheManager },
        { provide: EncryptionService, useFactory: mockEncryptionService },
      ],
    }).compile();

    aadhaarService = module.get<AadhaarService>(AadhaarService);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    encryptionService = module.get(EncryptionService);
  });

  describe('initiateVerification', () => {
    it('should throw BadRequestException for invalid Aadhaar format', async () => {
      await expect(aadhaarService.initiateVerification('user-1', '123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should return a transactionId on success', async () => {
      const result = await aadhaarService.initiateVerification('user-1', '123412341234');
      expect(result.transactionId).toBeDefined();
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException for invalid transaction', async () => {
      await expect(aadhaarService.verifyOtp('user-1', 'tx-1', '123456'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for incorrect OTP', async () => {
      cacheStore.set('aadhaar_verify_tx-1', {
        userId: 'user-1',
        aadhaarNumber: '123412341234',
        otp: '111111',
      });
      await expect(aadhaarService.verifyOtp('user-1', 'tx-1', '222222'))
        .rejects.toThrow(BadRequestException);
    });

    it('should update user record on successful verification', async () => {
      cacheStore.set('aadhaar_verify_tx-1', {
        userId: 'user-1',
        aadhaarNumber: '123412341234',
        otp: '123456',
      });

      const result = await aadhaarService.verifyOtp('user-1', 'tx-1', '123456');
      
      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
    });
  });

  describe('consent widget Aadhaar flow', () => {
    it('detects Aadhaar requirement on template flag', () => {
      expect(aadhaarService.isAadhaarRequiredForConsent({ requiresAadhaarVerification: true })).toBe(
        true,
      );
    });

    it('verifies consent OTP and sets verified cache', async () => {
      const init = await aadhaarService.initiateConsentVerification(
        'app-1',
        'tenant-1',
        '123412341234',
      );
      const otp = (init as { devOtp?: string }).devOtp || '123456';
      const result = await aadhaarService.verifyConsentOtp('app-1', init.transactionId, otp);
      expect(result.verified).toBe(true);
      await expect(
        aadhaarService.assertConsentAadhaarVerified('app-1', '123412341234'),
      ).resolves.toBeUndefined();
    });
  });
});
