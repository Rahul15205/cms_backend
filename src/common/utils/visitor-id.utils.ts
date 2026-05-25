import * as crypto from 'crypto';

/**
 * Normalize client IP from proxy headers (first hop, strip IPv4-mapped prefix).
 */
export function normalizeClientIp(ip?: string): string {
  if (!ip || typeof ip !== 'string') return '0.0.0.0';
  return ip.split(',')[0].trim().replace(/^::ffff:/, '');
}

/**
 * Deterministic visitor ID from IP + scope (websiteId / tenantId).
 * Same IP + same scope always yields the same ID (e.g. repeat cookie accept).
 */
export function deriveVisitorIdFromIp(ip: string | undefined, scope: string): string {
  const cleanIp = normalizeClientIp(ip);
  const hash = crypto
    .createHash('sha256')
    .update(`${scope}:${cleanIp}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
  return `VIS-${hash}`;
}

/** Legacy/random client IDs that should be replaced with IP-derived IDs. */
export function shouldReplaceClientVisitorId(userId?: string): boolean {
  if (!userId) return true;
  return (
    userId.startsWith('U-') ||
    userId.startsWith('VISIT-') ||
    /-USER-\d{4}$/.test(userId)
  );
}
