import { Injectable, BadRequestException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

const CONSENT_AADHAAR_TTL_MS = 10 * 60 * 1000;
const CONSENT_AADHAAR_VERIFIED_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class AadhaarService {
  private readonly logger = new Logger(AadhaarService.name);
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Initiates Aadhaar verification by sending a mock OTP.
   * Stores the Aadhaar number in a temporary transaction in Redis.
   */
  async initiateVerification(userId: string, aadhaarNumber: string) {
    // Basic Aadhaar format validation (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Invalid Aadhaar number format. Must be 12 digits.');
    }

    // Generate a unique transaction ID
    const transactionId = crypto.randomUUID();

    // In a real scenario, we would call the UIDAI / Sandbox API here to send an OTP
    // For now, we simulate the OTP sending.
    const mockOtp = '123456'; // Default mock OTP

    // Store the transaction details in Redis for 10 minutes
    await this.cacheManager.set(`aadhaar_verify_${transactionId}`, {
      userId,
      aadhaarNumber,
      otp: mockOtp, // In a real production system, the OTP is not stored here; it's sent to the user's mobile.
    }, 600000); // 10 minutes

    return {
      success: true,
      transactionId,
      message: 'OTP sent to the mobile number registered with your Aadhaar (Simulated).',
    };
  }

  /**
   * Verifies the OTP and updates the User record if successful.
   */
  async verifyOtp(userId: string, transactionId: string, otp: string) {
    const cacheKey = `aadhaar_verify_${transactionId}`;
    const transactionData: any = await this.cacheManager.get(cacheKey);

    if (!transactionData) {
      throw new UnauthorizedException('Invalid or expired transaction.');
    }

    if (transactionData.userId !== userId) {
      throw new UnauthorizedException('Transaction does not belong to this user.');
    }

    // Validate the OTP
    if (otp !== transactionData.otp) {
      throw new BadRequestException('Invalid OTP.');
    }

    const { aadhaarNumber } = transactionData;

    // Encrypt Aadhaar number for storage
    const encryptedAadhaar = this.encryptionService.encrypt(aadhaarNumber);
    const aadhaarHash = this.encryptionService.generateHash(aadhaarNumber);

    // Update the user record
    await (this.prisma.user as any).update({
      where: { id: userId },
      data: {
        aadhaarNumber: encryptedAadhaar,
        aadhaarHash,
        aadhaarVerified: true,
        aadhaarVerifiedAt: new Date(),
      },
    });

    // Clear the transaction from cache
    await this.cacheManager.del(cacheKey);

    return {
      success: true,
      message: 'Aadhaar verified successfully.',
    };
  }

  // ─── Public consent widget (end-user, no platform User record) ───

  isAadhaarRequiredForConsent(template: any): boolean {
    if (template?.requiresAadhaarVerification === true) return true;
    const wizard = template?.wizardFields;
    if (wizard?.requiresAadhaarVerification === true) return true;
    const method = (wizard?.verificationMethod || '').toString().toLowerCase();
    return method === 'aadhaar_ekyc' || method === 'aadhaar';
  }

  private consentVerifiedCacheKey(applicationId: string, aadhaarHash: string): string {
    return `consent_aadhaar_verified_${applicationId}_${aadhaarHash}`;
  }

  async initiateConsentVerification(
    applicationId: string,
    tenantId: string | null | undefined,
    aadhaarNumber: string,
  ) {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Invalid Aadhaar number. Must be 12 digits.');
    }

    const config = tenantId
      ? await this.prisma.aadhaarConfig.findUnique({ where: { tenantId } })
      : await this.prisma.aadhaarConfig.findFirst();

    if (config && !config.enabled) {
      throw new BadRequestException('Aadhaar verification is disabled for this organization.');
    }

    const transactionId = crypto.randomUUID();
    const mockOtp = process.env.AADHAAR_MOCK_OTP || '123456';
    const aadhaarHash = this.encryptionService.generateHash(aadhaarNumber);

    await this.cacheManager.set(
      `consent_aadhaar_${transactionId}`,
      {
        applicationId,
        tenantId: tenantId || null,
        aadhaarHash,
        otp: mockOtp,
      },
      CONSENT_AADHAAR_TTL_MS,
    );

    this.logger.log(
      `Consent Aadhaar OTP initiated for app ${applicationId} (simulated UIDAI send)`,
    );

    return {
      success: true,
      transactionId,
      message:
        'OTP sent to the mobile number registered with your Aadhaar (simulated).',
      consentText: config?.consentText || null,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: mockOtp } : {}),
    };
  }

  async verifyConsentOtp(applicationId: string, transactionId: string, otp: string) {
    const cacheKey = `consent_aadhaar_${transactionId}`;
    const transactionData: any = await this.cacheManager.get(cacheKey);

    if (!transactionData || transactionData.applicationId !== applicationId) {
      throw new UnauthorizedException('Invalid or expired Aadhaar verification session.');
    }

    if (otp.trim() !== transactionData.otp) {
      throw new BadRequestException('Invalid Aadhaar OTP.');
    }

    const verifiedKey = this.consentVerifiedCacheKey(applicationId, transactionData.aadhaarHash);
    await this.cacheManager.set(
      verifiedKey,
      {
        verifiedAt: new Date().toISOString(),
        transactionId,
      },
      CONSENT_AADHAAR_VERIFIED_TTL_MS,
    );
    await this.cacheManager.del(cacheKey);

    return {
      success: true,
      verified: true,
      message: 'Aadhaar verified. You may submit consent.',
    };
  }

  async assertConsentAadhaarVerified(applicationId: string, aadhaarNumber: string) {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Valid 12-digit Aadhaar number is required.');
    }
    const aadhaarHash = this.encryptionService.generateHash(aadhaarNumber);
    const verified = await this.cacheManager.get(this.consentVerifiedCacheKey(applicationId, aadhaarHash));
    if (!verified) {
      throw new BadRequestException(
        'Aadhaar verification required. Complete Aadhaar OTP verification before submitting consent.',
      );
    }
  }

  buildAadhaarConsentMetadata(aadhaarNumber: string): Record<string, unknown> {
    return {
      verificationMethod: 'AADHAAR_EKYC',
      aadhaarVerifiedAt: new Date().toISOString(),
      aadhaarLastFour: aadhaarNumber.slice(-4),
      aadhaarHash: this.encryptionService.generateHash(aadhaarNumber),
    };
  }
}