import {
  deriveVisitorIdFromIp,
  normalizeClientIp,
  shouldReplaceClientVisitorId,
  isGeoVisitorId,
} from './visitor-id.utils';

describe('visitor-id.utils', () => {
  it('normalizes forwarded IPv4', () => {
    expect(normalizeClientIp('203.0.113.1, 10.0.0.1')).toBe('203.0.113.1');
    expect(normalizeClientIp('::ffff:192.168.1.1')).toBe('192.168.1.1');
  });

  it('returns the same visitor ID for the same IP and scope', () => {
    const a = deriveVisitorIdFromIp('203.0.113.50', 'website-abc');
    const b = deriveVisitorIdFromIp('203.0.113.50', 'website-abc');
    expect(a).toBe(b);
    expect(a).toMatch(/^[A-Z]{2}-[A-Z0-9]{3}-USER-\d{4}$/);
  });

  it('returns different IDs for different IPs or scopes', () => {
    const sameScope = deriveVisitorIdFromIp('203.0.113.50', 'website-abc');
    const otherIp = deriveVisitorIdFromIp('203.0.113.51', 'website-abc');
    const otherScope = deriveVisitorIdFromIp('203.0.113.50', 'website-xyz');
    expect(sameScope).not.toBe(otherIp);
    expect(sameScope).not.toBe(otherScope);
  });

  it('flags legacy client IDs for replacement', () => {
    expect(shouldReplaceClientVisitorId('U-ABC123')).toBe(true);
    expect(shouldReplaceClientVisitorId('VIS-A1B2C3D4E5F67890')).toBe(true);
    expect(shouldReplaceClientVisitorId('IN-DEL-USER-3597')).toBe(false);
    expect(isGeoVisitorId('IN-SHI-USER-3597')).toBe(true);
  });
});
