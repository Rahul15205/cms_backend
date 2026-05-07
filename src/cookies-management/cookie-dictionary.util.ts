import { CookieCategoryType } from '@prisma/client';

export interface CookieInfo {
  name: string;
  description: string;
  category: CookieCategoryType;
  platform?: string;
  retention?: string;
  dataController?: string;
  confidence?: number;
  classificationTier?: number;
}

/**
 * Legacy hardcoded dictionary — kept as a fast in-memory fallback.
 * The primary classification is now done by CookieClassifierService (2,200+ entries).
 * This file is only used if the classifier service is not injected (e.g., in tests).
 */
export const COOKIE_DICTIONARY: Record<string, CookieInfo> = {
  // Analytics
  '_ga': { name: 'Google Analytics', description: 'Used to distinguish users.', category: 'ANALYTICS' },
  '_gid': { name: 'Google Analytics', description: 'Used to distinguish users.', category: 'ANALYTICS' },
  '_gat': { name: 'Google Analytics', description: 'Used to throttle request rate.', category: 'ANALYTICS' },
  '_ga_': { name: 'Google Analytics', description: 'Used to persist session state.', category: 'ANALYTICS' },
  
  // Hotjar
  '_hj': { name: 'Hotjar', description: 'Used to persist the Hotjar User ID, unique to that site on the browser.', category: 'ANALYTICS' },
  '_hp2_': { name: 'Hotjar', description: 'Used to identify the user session.', category: 'ANALYTICS' },

  // Marketing / Advertising
  '_fbp': { name: 'Facebook Pixel', description: 'Used by Facebook to deliver advertising products.', category: 'ADVERTISING' },
  'fr': { name: 'Facebook Pixel', description: 'Used by Facebook to deliver advertising products.', category: 'ADVERTISING' },
  'ads/ga-audiences': { name: 'Google Ads', description: 'Used by Google AdWords to re-engage visitors.', category: 'ADVERTISING' },
  '_gcl_au': { name: 'Google AdSense', description: 'Used for experimenting with advertisement efficiency.', category: 'ADVERTISING' },
  
  // HubSpot
  '__hstc': { name: 'HubSpot Tracking', description: 'The main cookie for tracking visitors.', category: 'ANALYTICS' },
  'hubspotutk': { name: 'HubSpot Browser Token', description: 'Keeps track of a visitor\'s identity.', category: 'ANALYTICS' },
  '__hssc': { name: 'HubSpot Session', description: 'Keeps track of sessions.', category: 'ANALYTICS' },
  '__hssrc': { name: 'HubSpot Session Identification', description: 'Used to determine if the visitor has restarted their browser.', category: 'ANALYTICS' },
  'messagesUtk': { name: 'HubSpot Messages', description: 'Used to recognize visitors who chat via the messages tool.', category: 'FUNCTIONAL' },

  // Functional
  'lang': { name: 'Language Preference', description: 'Remembers the user\'s selected language.', category: 'FUNCTIONAL' },
  'lidc': { name: 'LinkedIn', description: 'Used for routing.', category: 'FUNCTIONAL' },
  'li_sugr': { name: 'LinkedIn', description: 'Used for browser identification.', category: 'ANALYTICS' },
  
  // Necessary
  'PHPSESSID': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
  'JSESSIONID': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
  'csrf_token': { name: 'CSRF Token', description: 'Protects against Cross-Site Request Forgery.', category: 'NECESSARY' },
  'connect.sid': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
  'cookie_consent': { name: 'Cookie Consent', description: 'Remembers the user\'s cookie consent settings.', category: 'NECESSARY' },
  '__cf_bm': { name: 'Cloudflare', description: 'Used to support Cloudflare Bot Management.', category: 'NECESSARY' },
  '_clck': { name: 'Microsoft Clarity', description: 'Used to store a unique user ID.', category: 'ANALYTICS' },
  '_clsk': { name: 'Microsoft Clarity', description: 'Used to connect multiple page views by a single user into a single Clarity session recording.', category: 'ANALYTICS' },
};

/**
 * Legacy classify function — kept for backward compatibility.
 * For new code, inject CookieClassifierService instead.
 */
export function classifyCookie(name: string): CookieInfo {
  // Check exact match
  if (COOKIE_DICTIONARY[name]) return COOKIE_DICTIONARY[name];
  
  // Check prefix matches
  for (const key in COOKIE_DICTIONARY) {
    if (name.startsWith(key)) return COOKIE_DICTIONARY[key];
  }
  
  // Default: Uncategorized
  return {
    name: name,
    description: 'Unknown cookie discovered during scan.',
    category: 'UNCATEGORIZED',
  };
}
