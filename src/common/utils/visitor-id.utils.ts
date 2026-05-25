import * as crypto from 'crypto';
import * as geoip from 'geoip-lite';

/**
 * Normalize client IP from proxy headers (first hop, strip IPv4-mapped prefix).
 */
export function normalizeClientIp(ip?: string): string {
  if (!ip || typeof ip !== 'string') return '0.0.0.0';
  return ip.split(',')[0].trim().replace(/^::ffff:/, '');
}

function geoCodesFromIp(cleanIp: string): { countryCode: string; cityCode: string } {
  let countryCode = 'XX';
  let cityCode = 'UNK';

  const isPrivate =
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.includes('localhost') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(cleanIp);

  if (isPrivate) {
    return { countryCode: 'LO', cityCode: 'CAL' };
  }

  const geo = geoip.lookup(cleanIp);
  if (geo) {
    countryCode = geo.country || 'XX';
    const rawCity = geo.city || geo.region || 'UNK';
    cityCode = rawCity.substring(0, 3).toUpperCase();
  }

  return { countryCode, cityCode };
}

/**
 * Deterministic visitor ID: {CC}-{CITY}-USER-{####} (e.g. IN-SHI-USER-3597).
 * Same IP + same scope always yields the same ID.
 */
export function deriveVisitorIdFromIp(ip: string | undefined, scope: string): string {
  const cleanIp = normalizeClientIp(ip);
  const { countryCode, cityCode } = geoCodesFromIp(cleanIp);

  const hash = crypto.createHash('sha256').update(`${scope}:${cleanIp}`).digest('hex');
  const sequence = ((parseInt(hash.slice(0, 8), 16) % 9999) + 1).toString().padStart(4, '0');

  return `${countryCode}-${cityCode}-USER-${sequence}`;
}

/** Legacy/random client IDs that should be replaced with IP-derived IDs. */
export function shouldReplaceClientVisitorId(userId?: string): boolean {
  if (!userId) return true;
  return userId.startsWith('U-') || userId.startsWith('VISIT-') || userId.startsWith('VIS-');
}

/** Geo-style visitor ID: IN-SHI-USER-3597 */
export function isGeoVisitorId(userId?: string): boolean {
  if (!userId) return false;
  return /^[A-Z]{2}-[A-Z0-9]{3}-USER-\d{4}$/.test(userId);
}
