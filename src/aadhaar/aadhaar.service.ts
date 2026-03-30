import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class AadhaarService {
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
}