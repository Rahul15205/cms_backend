import { Request } from 'express';
import * as geoip from 'geoip-lite';

function normalizeIp(raw?: string): string | undefined {
  if (!raw) return undefined;
  const ip = raw.split(',')[0]?.trim().replace(/^::ffff:/i, '');
  if (!ip || ip === '::1') return '127.0.0.1';
  return ip;
}

/** Resolve client IP from proxy headers (nginx, Cloudflare, etc.). */
export function getClientIp(req?: Request): string | undefined {
  if (!req) return undefined;

  const cfIp = req.headers['cf-connecting-ip'];
  const xRealIp = req.headers['x-real-ip'];
  const forwarded = req.headers['x-forwarded-for'];

  const candidates: string[] = [];
  if (typeof cfIp === 'string') candidates.push(cfIp);
  if (typeof xRealIp === 'string') candidates.push(xRealIp);
  if (typeof forwarded === 'string') candidates.push(forwarded);
  if (Array.isArray(forwarded)) candidates.push(...forwarded.map(String));

  for (const raw of candidates) {
    const ip = normalizeIp(raw);
    if (ip && ip !== '127.0.0.1') return ip;
  }

  return normalizeIp(req.ip || req.socket?.remoteAddress);
}

export function parseUserAgent(userAgent?: string): { device: string; browser: string } {
  const ua = userAgent || '';
  const lower = ua.toLowerCase();

  let device = 'Desktop';
  if (/tablet|ipad/i.test(ua)) device = 'Tablet';
  else if (/mobile|android|iphone/i.test(ua)) device = 'Mobile';

  let browser = 'Browser';
  if (lower.includes('edg/')) browser = 'Edge';
  else if (lower.includes('chrome/')) browser = 'Chrome';
  else if (lower.includes('firefox/')) browser = 'Firefox';
  else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';

  return { device, browser };
}

/** Human-readable location from IP (geoip-lite, offline). */
export function resolveLocationFromIp(ip?: string | null): string | null {
  if (!ip) return null;

  const cleanIp = normalizeIp(ip);
  if (!cleanIp) return null;

  if (
    cleanIp === '127.0.0.1' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(cleanIp)
  ) {
    return 'Private Network';
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (!geo) return null;

    const parts: string[] = [];
    if (geo.city) parts.push(geo.city);
    if (geo.region && geo.region !== geo.city) parts.push(geo.region);
    if (geo.country) parts.push(geo.country);

    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

export function buildSessionMeta(req?: Request): {
  ipAddress: string | null;
  location: string | null;
  device: string;
  browser: string;
} {
  const ipAddress = getClientIp(req) || null;
  const userAgent = req?.headers?.['user-agent'] as string | undefined;
  const { device, browser } = parseUserAgent(userAgent);
  const location = resolveLocationFromIp(ipAddress);

  return { ipAddress, location, device, browser };
}
