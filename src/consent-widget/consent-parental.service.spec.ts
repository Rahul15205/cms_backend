import { ConsentParentalService } from './consent-parental.service';
import { BadRequestException } from '@nestjs/common';

describe('ConsentParentalService', () => {
  const service = new ConsentParentalService();

  it('detects parental flow from type or minor category', () => {
    expect(service.isParentalFlow({ type: 'PARENTAL' })).toBe(true);
    expect(service.isParentalFlow({ targetUserCategory: ['MINOR'] })).toBe(true);
    expect(service.isParentalFlow({ targetUserCategory: ['CUSTOMER', 'MINOR'] })).toBe(true);
  });

  it('requires guardian details below age threshold', () => {
    expect(() =>
      service.resolveContext({ type: 'PARENTAL', ageThreshold: 18 }, { minorAge: 14 }),
    ).toThrow(BadRequestException);

    const ctx = service.resolveContext(
      { type: 'PARENTAL', ageThreshold: 18 },
      {
        minorAge: 14,
        guardianName: 'Parent',
        guardianEmail: 'parent@example.com',
        guardianRelationship: 'Mother',
      },
    );
    expect(ctx.consentGivenBy).toBe('GUARDIAN');
    expect(ctx.needsGuardianOtp).toBe(true);
  });

  it('allows self consent at or above threshold', () => {
    const ctx = service.resolveContext(
      { type: 'PARENTAL', ageThreshold: 18 },
      { minorAge: 20, email: 'adult@example.com' },
    );
    expect(ctx.consentGivenBy).toBe('SELF');
    expect(ctx.needsGuardianOtp).toBe(false);
  });
});
