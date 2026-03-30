/**
 * Masks an email address: john.doe@example.com -> j***e@e***.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');

  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '*';

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return `${maskedLocal}@${domain}`;

  const domName = domainParts[0];
  const tld = domainParts.slice(1).join('.');

  const maskedDom = domName.length > 2 
    ? domName[0] + '*'.repeat(domName.length - 2) + domName[domName.length - 1]
    : domName[0] + '*';

  return `${maskedLocal}@${maskedDom}.${tld}`;
}

/**
 * Masks a phone number: +1234567890 -> ******7890
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\s+/g, ''); // just remove spaces
  if (cleaned.length < 6) return '*'.repeat(cleaned.length);

  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

/**
 * Masks Aadhaar number: 1234 5678 9012 -> ********9012
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/\s+/g, '');
  if (cleaned.length < 4) return aadhaar;

  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

/**
 * Recursively scans and masks PII fields in a JSON object structure
 */
export function maskObjectPii(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => maskObjectPii(item));
  }

  const result = { ...obj };
  
  for (const key in result) {
    const value = result[key];
    if (typeof value === 'string') {
      const lowerKey = key.toLowerCase();
      
      // Mask Email
      if (lowerKey.includes('email') || value.includes('@')) {
        result[key] = maskEmail(value);
      } 
      // Mask Phone
      else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        result[key] = maskPhone(value);
      } 
      // Mask Aadhaar
      else if (lowerKey.includes('aadhaar')) {
        result[key] = maskAadhaar(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskObjectPii(value);
    }
  }
  return result;
}
