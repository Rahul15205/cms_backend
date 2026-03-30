import { CookieCategoryType } from '@prisma/client';

export interface CookieInfo {
  name: string;
  description: string;
  category: CookieCategoryType;
}

export const COOKIE_DICTIONARY: Record<string, CookieInfo> = {
  // Analytics
  '_ga': { name: 'Google Analytics', description: 'Used to distinguish users.', category: 'ANALYTICS' },
  '_gid': { name: 'Google Analytics', description: 'Used to distinguish users.', category: 'ANALYTICS' },
  '_gat': { name: 'Google Analytics', description: 'Used to throttle request rate.', category: 'ANALYTICS' },
  
  // Marketing / Advertising
  '_fbp': { name: 'Facebook Pixel', description: 'Used by Facebook to deliver advertising products.', category: 'ADVERTISING' },
  'fr': { name: 'Facebook Pixel', description: 'Used by Facebook to deliver advertising products.', category: 'ADVERTISING' },
  'ads/ga-audiences': { name: 'Google Ads', description: 'Used by Google AdWords to re-engage visitors.', category: 'ADVERTISING' },
  
  // Functional
  'lang': { name: 'Language Preference', description: 'Remembers the user\'s selected language.', category: 'FUNCTIONAL' },
  'lidc': { name: 'LinkedIn', description: 'Used for routing.', category: 'FUNCTIONAL' },
  
  // Necessary
  'PHPSESSID': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
  'JSESSIONID': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
  'csrf_token': { name: 'CSRF Token', description: 'Protects against Cross-Site Request Forgery.', category: 'NECESSARY' },
  'connect.sid': { name: 'Session ID', description: 'Maintains user session state.', category: 'NECESSARY' },
};

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
