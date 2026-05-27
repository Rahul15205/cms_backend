import { BadRequestException, Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { ConsentParentalService } from './consent-parental.service';

const CONSENT_OTP_TTL_MS = 10 * 60 * 1000;
const CONSENT_OTP_VERIFIED_TTL_MS = 30 * 60 * 1000;
const CONSENT_OTP_MAX_ATTEMPTS = 5;

export type ConsentOtpChannel = 'email' | 'phone';

@Injectable()
export class ConsentOtpService {
  private readonly logger = new Logger(ConsentOtpService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly notifications: NotificationsService,
    private readonly consentParentalService: ConsentParentalService,
  ) {}

  isOtpRequired(template: any): boolean {
    if (template?.requiresOtpVerification === true) return true;
    const wizard = template?.wizardFields;
    if (wizard?.requiresOtpVerification === true) return true;
    const mechanism = (template?.mechanism || wizard?.mechanism || '').toString().toUpperCase();
    return mechanism === 'SIGNATURE';
  }

  /** Template OTP flag OR guardian OTP when user age is below threshold. */
  isOtpNeededForSubmission(template: any, context?: { minorAge?: number | null }): boolean {
    if (this.isOtpRequired(template)) return true;
    if (context?.minorAge !== undefined && context?.minorAge !== null) {
      return this.consentParentalService.isMinorBelowThreshold(template, context.minorAge);
    }
    return false;
  }

  shouldUseGuardianContact(template: any, minorAge?: number | null): boolean {
    return (
      !this.isOtpRequired(template) &&
      this.consentParentalService.isMinorBelowThreshold(template, minorAge)
    );
  }

  async sendOtp(
    applicationId: string,
    payload: { email?: string; phone?: string },
  ): Promise<{ success: boolean; channel: ConsentOtpChannel; message: string; devOtp?: string }> {
    const { channel, subject } = this.resolveChannel(payload);
    const subjectKey = this.buildSubjectKey(applicationId, subject);
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(subjectKey, otp);

    await this.cache.set(
      `consent_otp:${subjectKey}`,
      { otpHash, attempts: 0, applicationId, channel, subject },
      CONSENT_OTP_TTL_MS,
    );
    await this.cache.del(`consent_otp_verified:${subjectKey}`);

    if (channel === 'email') {
      const sent = await this.notifications.sendConsentVerificationOtp(
        subject,
        otp,
        CONSENT_OTP_TTL_MS / 60000,
      );
      if (!sent) {
        throw new BadRequestException('Unable to send verification OTP email. Please try again.');
      }
      return {
        success: true,
        channel,
        message: 'Verification OTP sent to your email.',
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
      };
    }

    this.logger.log(`Consent OTP for phone ${subject} (app ${applicationId}): ${otp}`);
    return {
      success: true,
      channel,
      message:
        'Verification OTP sent to your phone (SMS integration pending — check server logs in development).',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    };
  }

  async verifyOtp(
    applicationId: string,
    payload: { email?: string; phone?: string; otp: string },
  ): Promise<{ verified: boolean; message: string }> {
    const { subject } = this.resolveChannel(payload);
    const subjectKey = this.buildSubjectKey(applicationId, subject);
    const stored: any = await this.cache.get(`consent_otp:${subjectKey}`);

    if (!stored || stored.applicationId !== applicationId) {
      throw new BadRequestException('Invalid or expired OTP. Please request a new one.');
    }

    if (stored.attempts >= CONSENT_OTP_MAX_ATTEMPTS) {
      await this.cache.del(`consent_otp:${subjectKey}`);
      throw new BadRequestException('Too many invalid attempts. Please request a new OTP.');
    }

    const otp = (payload.otp || '').trim();
    const otpHash = this.hashOtp(subjectKey, otp);

    if (otpHash !== stored.otpHash) {
      await this.cache.set(
        `consent_otp:${subjectKey}`,
        { ...stored, attempts: stored.attempts + 1 },
        CONSENT_OTP_TTL_MS,
      );
      throw new BadRequestException('Invalid OTP.');
    }

    await this.cache.set(`consent_otp_verified:${subjectKey}`, '1', CONSENT_OTP_VERIFIED_TTL_MS);
    await this.cache.del(`consent_otp:${subjectKey}`);

    return { verified: true, message: 'OTP verified. You may submit consent.' };
  }

  async assertVerified(applicationId: string, email?: string, phone?: string): Promise<void> {
    const subject = this.normalizeSubject(email, phone);
    if (!subject) {
      throw new BadRequestException('Email or phone is required for OTP verification.');
    }
    const subjectKey = this.buildSubjectKey(applicationId, subject);
    const verified = await this.cache.get(`consent_otp_verified:${subjectKey}`);
    if (!verified) {
      throw new BadRequestException(
        'OTP verification required. Send and verify OTP before submitting consent.',
      );
    }
  }

  private resolveChannel(payload: { email?: string; phone?: string }): {
    channel: ConsentOtpChannel;
    subject: string;
  } {
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    if (email) return { channel: 'email', subject: email };
    if (phone) return { channel: 'phone', subject: phone };
    throw new BadRequestException('Email or phone is required to send OTP.');
  }

  private normalizeSubject(email?: string, phone?: string): string | null {
    const e = email?.trim().toLowerCase();
    if (e) return e;
    const p = phone?.trim();
    if (p) return p;
    return null;
  }

  private buildSubjectKey(applicationId: string, subject: string): string {
    return crypto.createHash('sha256').update(`${applicationId}:${subject}`).digest('hex');
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private hashOtp(subjectKey: string, otp: string): string {
    return crypto.createHash('sha256').update(`${subjectKey}:${otp.trim()}`).digest('hex');
  }
}
