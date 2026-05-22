import { Request } from 'express';

export function getClientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0]?.trim();
  }
  return req.ip || req.socket?.remoteAddress || undefined;
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
