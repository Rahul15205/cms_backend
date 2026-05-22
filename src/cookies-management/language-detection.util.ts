/**
 * Browser-side language localization detection for cookie compliance scans.
 * detectPageLanguage is passed to page.evaluate() — must be fully self-contained.
 */

export interface LanguageDetectionResult {
  detected: boolean;
  method: string;
  snippet: string;
  languages: string[];
}

export function detectPageLanguage(pageUrl?: string): LanguageDetectionResult {
  const ENGLISH_LANG_CODES = new Set([
    'en', 'en-us', 'en-gb', 'en-au', 'en-ca', 'en-nz', 'en-ie', 'en-za',
  ]);

  const LANG_CODE_NAMES: Record<string, string> = {
    hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada',
    ml: 'Malayalam', bn: 'Bengali', gu: 'Gujarati', pa: 'Punjabi', or: 'Odia',
    as: 'Assamese', ur: 'Urdu', sa: 'Sanskrit', ne: 'Nepali', si: 'Sinhala',
    fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese', it: 'Italian',
    nl: 'Dutch', pl: 'Polish', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
    ko: 'Korean', ar: 'Arabic', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
    ms: 'Malay', tr: 'Turkish', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
    fi: 'Finnish', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', el: 'Greek',
    he: 'Hebrew', uk: 'Ukrainian',
  };

  const LANGUAGE_NAME_PATTERN =
    /\b(hindi|हिंदी|हिन्दी|marathi|मराठी|tamil|தமிழ்|telugu|తెలుగు|kannada|ಕನ್ನಡ|malayalam|മലയാളം|bengali|বাংলা|gujarati|ગુજરાતી|punjabi|ਪੰਜਾਬੀ|odia|ଓଡ଼ିଆ|assamese|অসমীয়া|urdu|اردو|sanskrit|संस्कृत|english|français|french|deutsch|german|español|spanish|português|portuguese|italiano|italian|nederlands|dutch|русский|russian|中文|chinese|日本語|japanese|한국어|korean|العربية|arabic)\b/i;

  const SWITCHER_SELECTOR_PATTERN =
    /lang|language|locale|i18n|translation|wpml|polylang|qtran|gtranslate|weglot|loco/i;

  const SWITCHER_TEXT_PATTERN =
    /language|select language|choose language|भाषा|भाषा चुनें|மொழி|భాష|ಭಾಷೆ|ഭാഷ|ভাষা|ભાષા|ਭਾ਷ਾ/i;

  const SCRIPT_RANGES: { name: string; re: RegExp }[] = [
    { name: 'Devanagari (Hindi/Marathi)', re: /[\u0900-\u097F]/ },
    { name: 'Bengali', re: /[\u0980-\u09FF]/ },
    { name: 'Gurmukhi (Punjabi)', re: /[\u0A00-\u0A7F]/ },
    { name: 'Gujarati', re: /[\u0A80-\u0AFF]/ },
    { name: 'Odia', re: /[\u0B00-\u0B7F]/ },
    { name: 'Tamil', re: /[\u0B80-\u0BFF]/ },
    { name: 'Telugu', re: /[\u0C00-\u0C7F]/ },
    { name: 'Kannada', re: /[\u0C80-\u0CFF]/ },
    { name: 'Malayalam', re: /[\u0D00-\u0D7F]/ },
    { name: 'Arabic', re: /[\u0600-\u06FF]/ },
    { name: 'Chinese', re: /[\u4E00-\u9FFF]/ },
    { name: 'Japanese', re: /[\u3040-\u30FF\u4E00-\u9FFF]/ },
    { name: 'Korean', re: /[\uAC00-\uD7AF]/ },
    { name: 'Cyrillic', re: /[\u0400-\u04FF]/ },
    { name: 'Thai', re: /[\u0E00-\u0E7F]/ },
  ];

  const normalizeLangCode = (raw: string): string =>
    raw.trim().toLowerCase().replace(/_/g, '-');

  const langCodeToName = (code: string): string => {
    const base = code.split('-')[0];
    return LANG_CODE_NAMES[base] || code;
  };

  const isNonEnglishLangCode = (code: string): boolean => {
    if (!code) return false;
    const norm = normalizeLangCode(code);
    if (ENGLISH_LANG_CODES.has(norm)) return false;
    const base = norm.split('-')[0];
    return !ENGLISH_LANG_CODES.has(base);
  };

  const collectLangCodesFromUrl = (url: string): string[] => {
    const found: string[] = [];
    try {
      const u = new URL(url);
      for (const seg of u.pathname.split('/').filter(Boolean)) {
        const m = seg.match(/^([a-z]{2})(?:[-_]([a-z]{2}))?$/i);
        if (m) {
          const code = m[2] ? `${m[1]}-${m[2]}`.toLowerCase() : m[1].toLowerCase();
          if (isNonEnglishLangCode(code)) found.push(code);
        }
      }
      const langParam =
        u.searchParams.get('lang') ||
        u.searchParams.get('language') ||
        u.searchParams.get('locale');
      if (langParam && isNonEnglishLangCode(langParam)) found.push(normalizeLangCode(langParam));
    } catch { /* invalid URL */ }
    return found;
  };

  const detectScripts = (text: string, minChars = 12): string[] => {
    const scripts: string[] = [];
    for (const { name, re } of SCRIPT_RANGES) {
      const matches = text.match(new RegExp(re.source, 'g'));
      if (matches && matches.join('').length >= minChars) scripts.push(name);
    }
    return scripts;
  };

  const languages = new Set<string>();
  let method = '';
  let snippet = '';

  const htmlLang = normalizeLangCode(document.documentElement.lang || '');
  if (htmlLang && isNonEnglishLangCode(htmlLang)) {
    languages.add(langCodeToName(htmlLang));
    method = 'html_lang';
    snippet = `HTML lang="${document.documentElement.lang}"`;
  }

  if (pageUrl) {
    const urlCodes = collectLangCodesFromUrl(pageUrl);
    if (urlCodes.length) {
      urlCodes.forEach((c) => languages.add(langCodeToName(c)));
      if (!method) {
        method = 'url_locale';
        snippet = `URL indicates locale: ${urlCodes.join(', ')}`;
      }
    }
  }

  const switcherLabels = new Set<string>();
  const addLabel = (s: string) => {
    const t = s?.trim();
    if (t && t.length < 80) switcherLabels.add(t);
  };

  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
    const code = (el as HTMLLinkElement).hreflang;
    if (code && code !== 'x-default' && isNonEnglishLangCode(code)) addLabel(langCodeToName(code));
  });

  const metaLang =
    document.querySelector('meta[http-equiv="content-language" i]')?.getAttribute('content') ||
    document.querySelector('meta[name="language" i]')?.getAttribute('content');
  if (metaLang) {
    metaLang.split(/[,;]/).forEach((c) => {
      const code = normalizeLangCode(c);
      if (isNonEnglishLangCode(code)) addLabel(langCodeToName(code));
    });
  }

  const ogLocale = document.querySelector('meta[property="og:locale" i]')?.getAttribute('content');
  if (ogLocale && isNonEnglishLangCode(ogLocale)) addLabel(langCodeToName(ogLocale));

  const candidates = document.querySelectorAll(
    [
      'select', 'button', 'a', '[role="button"]', '[role="menuitem"]',
      '[class*="lang" i]', '[id*="lang" i]', '[class*="language" i]', '[id*="language" i]',
      '[class*="locale" i]', '[data-lang]', '[data-language]', '[data-locale]',
      '.wpml-ls-item', '.polylang-lang', '.language-switcher', '.lang-switcher',
    ].join(', '),
  );

  for (const el of Array.from(candidates)) {
    const htmlEl = el as HTMLElement;
    const attrs = [
      htmlEl.getAttribute('aria-label'),
      htmlEl.getAttribute('title'),
      htmlEl.getAttribute('data-lang'),
      htmlEl.getAttribute('data-language'),
      htmlEl.textContent,
    ]
      .filter(Boolean)
      .join(' ');
    const idClass = `${htmlEl.id || ''} ${htmlEl.className || ''}`;

    if (SWITCHER_SELECTOR_PATTERN.test(idClass) || SWITCHER_TEXT_PATTERN.test(attrs)) {
      const text = (htmlEl.textContent || '').trim();
      addLabel(text ? text.slice(0, 60) : 'Language switcher');
    }

    if (el.tagName === 'SELECT') {
      Array.from((el as HTMLSelectElement).options).forEach((opt) => {
        const val = opt.value || opt.textContent || '';
        const m = val.match(/^([a-z]{2})(?:[-_]([a-z]{2}))?$/i);
        if (m) {
          const code = m[2] ? `${m[1]}-${m[2]}`.toLowerCase() : m[1].toLowerCase();
          if (isNonEnglishLangCode(code)) addLabel(langCodeToName(code));
        } else if (LANGUAGE_NAME_PATTERN.test(val)) {
          addLabel(val.trim().slice(0, 40));
        }
      });
    }

    const href = (el as HTMLAnchorElement).href || '';
    if (href) collectLangCodesFromUrl(href).forEach((c) => addLabel(langCodeToName(c)));
  }

  const navAreas = document.querySelectorAll('nav, header, footer, [role="navigation"]');
  const linkRoots = navAreas.length ? Array.from(navAreas) : [document.body];
  for (const root of linkRoots) {
    if (!root) continue;
    root.querySelectorAll('a[href]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const linkText = (a.textContent || '').trim();
      collectLangCodesFromUrl(href).forEach((c) => addLabel(langCodeToName(c)));
      if (LANGUAGE_NAME_PATTERN.test(linkText) && linkText.length < 40) addLabel(linkText);
    });
  }

  if (switcherLabels.size > 0) {
    switcherLabels.forEach((l) => languages.add(l));
    if (!method) {
      method = 'language_switcher';
      snippet = `Language options: ${Array.from(switcherLabels).slice(0, 5).join(', ')}`;
    }
  }

  const mainEl =
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('article') ||
    document.body;
  const mainText = (mainEl?.innerText || '').slice(0, 8000);

  let bannerText = '';
  const bannerSelectors = [
    '#CybotCookiebotDialog', '#onetrust-banner-sdk', '.cky-consent-container',
    '[id*="cookie" i][role="dialog"]', '[class*="cookie-consent" i]', '[class*="cookie-banner" i]',
    '[role="alertdialog"]',
  ];
  for (const sel of bannerSelectors) {
    const bel = document.querySelector(sel) as HTMLElement | null;
    if (bel?.innerText) {
      bannerText += bel.innerText + ' ';
      if (bannerText.length > 500) break;
    }
  }

  const allScripts = [
    ...new Set([...detectScripts(mainText), ...detectScripts(bannerText, 8)]),
  ];
  if (allScripts.length) {
    allScripts.forEach((s) => languages.add(s));
    if (!method) {
      method = detectScripts(bannerText, 8).length ? 'consent_banner_script' : 'page_content_script';
      snippet = `Non-Latin script detected: ${allScripts.join(', ')}`;
    }
  }

  const visibleSample = (document.body?.innerText || '').slice(0, 15000);
  const nameMatch = visibleSample.match(LANGUAGE_NAME_PATTERN);
  if (nameMatch && !method && !/^english$/i.test(nameMatch[0])) {
    languages.add(nameMatch[0]);
    method = 'language_name_in_content';
    snippet = `Language reference in content: "${nameMatch[0]}"`;
  }

  const hreflangCodes = Array.from(
    document.querySelectorAll('link[rel="alternate"][hreflang]'),
  )
    .map((el) => normalizeLangCode((el as HTMLLinkElement).hreflang))
    .filter((c) => c && c !== 'x-default');
  const uniqueHreflang = [...new Set(hreflangCodes)];
  const nonEnHreflang = uniqueHreflang.filter(isNonEnglishLangCode);
  if (nonEnHreflang.length >= 1 && uniqueHreflang.length >= 2) {
    nonEnHreflang.forEach((c) => languages.add(langCodeToName(c)));
    if (!method) {
      method = 'hreflang_alternates';
      snippet = `hreflang alternates: ${uniqueHreflang.join(', ')}`;
    }
  }

  const detected = languages.size > 0;
  if (detected && !snippet) {
    snippet = `Languages detected: ${Array.from(languages).slice(0, 5).join(', ')}`;
  }

  return {
    detected,
    method: method || (detected ? 'combined' : 'none'),
    snippet,
    languages: Array.from(languages),
  };
}
