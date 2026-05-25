import { ConsentOtpService } from './consent-otp.service';
import { BadRequestException } from '@nestjs/common';

describe('ConsentOtpService', () => {
  const cache = new Map<string, unknown>();
  const mockCache = {
    get: jest.fn((k: string) => cache.get(k)),
    set: jest.fn((k: string, v: unknown) => {
      cache.set(k, v);
      return v;
    }),
    del: jest.fn((k: string) => {
      cache.delete(k);
    }),
  };
  const notifications = {
    sendConsentVerificationOtp: jest.fn().mockResolvedValue(true),
  };

  let service: ConsentOtpService;

  beforeEach(() => {
    cache.clear();
    jest.clearAllMocks();
    service = new ConsentOtpService(mockCache as any, notifications as any);
  });

  it('requires OTP when mechanism is SIGNATURE', () => {
    expect(service.isOtpRequired({ mechanism: 'SIGNATURE' })).toBe(true);
    expect(service.isOtpRequired({ mechanism: 'CHECKBOX' })).toBe(false);
  });

  it('verifies OTP and allows assertVerified', async () => {
    const send = await service.sendOtp('app-1', { email: 'user@example.com' });
    const otp = send.devOtp!;
    await service.verifyOtp('app-1', { email: 'user@example.com', otp });
    await expect(service.assertVerified('app-1', 'user@example.com')).resolves.toBeUndefined();
  });

  it('rejects invalid OTP', async () => {
    await service.sendOtp('app-1', { email: 'user@example.com' });
    await expect(
      service.verifyOtp('app-1', { email: 'user@example.com', otp: '000000' }),
    ).rejects.toThrow(BadRequestException);
  });
});
