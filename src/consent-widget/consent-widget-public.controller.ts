import { Controller, Get, Post, Body, Param, Header, Request } from '@nestjs/common';
import { ConsentWidgetService } from './consent-widget.service';

@Controller('api/v1/public/consent')
export class ConsentWidgetPublicController {
  constructor(private readonly widgetService: ConsentWidgetService) {}

  /**
   * Returns the widget configuration as JSON (for API-based integrations).
   */
  @Get('widget/:applicationId')
  async getWidgetConfig(@Param('applicationId') applicationId: string) {
    return this.widgetService.getPublicWidgetConfig(applicationId);
  }

  /**
   * Returns a self-executing JavaScript file that renders the consent widget.
   * Usage: <script src="https://your-server.com/api/v1/public/consent/widget-script/APP_ID"></script>
   */
  @Get('widget-script/:applicationId')
  @Header('Content-Type', 'application/javascript')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('Access-Control-Allow-Origin', '*')
  async getWidgetScript(@Param('applicationId') applicationId: string, @Request() req) {
    const widget = await this.widgetService.getPublicWidgetConfig(applicationId);

    if (!widget) {
      return `console.warn('Proteccio: No active consent widget found for application ${applicationId}');`;
    }

    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;
    // Extraction logic for JSON-based or Relation-based data
    const template = widget.template as any;
    const wizard = template?.wizardFields || {};
    
    const purposes = (template?.purposes?.length > 0) ? template.purposes : (wizard.purposes || []);
    const dataCategories = (template?.dataCategories?.length > 0) ? template.dataCategories : (wizard.dataCategories || []);
    const thirdParties = (template?.thirdParties?.length > 0) ? template.thirdParties : (wizard.thirdParties || []);
    const retention = wizard.retention || {};
    const withdrawal = wizard.withdrawal || {};
    const supportedLanguages: string[] = template?.supportedLanguages || wizard.supportedLanguages || [widget.defaultLanguage || 'en'];
    const validityDuration = wizard.validityDuration || (template?.noExpiry ? 'No Expiry' : null);
    const dataPrincipal = {
      targetUserCategory: (template?.targetUserCategory || wizard.targetUserCategory || []).join(', '),
      ageThreshold: template?.ageThreshold ?? wizard.ageThreshold ?? null,
      consentGivenBy: template?.consentGivenBy || wizard.consentGivenBy || null,
    };
    
    const logoUrl = widget.logoUrl || `https://res.cloudinary.com/dlfzzfdx0/image/upload/v1777286182/Brand_title_with_tagline-removebg-preview_jpjpet.png`;

    return `
(function() {
  'use strict';
  var config = ${JSON.stringify({
    id: widget.id,
    name: widget.name,
    displayMode: widget.displayMode,
    trigger: widget.trigger,
    position: widget.position,
    themeColor: widget.themeColor,
    backgroundColor: widget.backgroundColor,
    textColor: widget.textColor,
    buttonTextColor: widget.buttonTextColor,
    borderRadius: widget.borderRadius,
    fontSize: widget.fontSize,
    heading: widget.heading,
    description: widget.description,
    collectName: widget.collectName,
    collectEmail: widget.collectEmail,
    collectPhone: widget.collectPhone,
    requireAllPurposes: widget.requireAllPurposes,
    showPrivacyLink: widget.showPrivacyLink,
    privacyPolicyUrl: widget.privacyPolicyUrl,
    acceptAllText: widget.acceptAllText,
    rejectAllText: widget.rejectAllText,
    savePrefsText: widget.savePrefsText,
    defaultLanguage: widget.defaultLanguage,
    customCss: widget.customCss,
  })};
  config.applicationId = '${applicationId}';
  config.baseUrl = '${baseUrl}';
  var purposes = ${JSON.stringify((purposes || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isPrimary: p.isPrimary,
    necessity: (p.necessity || '').toUpperCase(),
  })))};
  var dataCategories = ${JSON.stringify((dataCategories || []).map(c => ({
    category: c.category,
    label: c.label,
    mandatory: c.mandatory
  })))};
  var thirdParties = ${JSON.stringify((thirdParties || []).map(t => ({
    name: t.name,
    role: t.role || '',
    country: t.country || '',
    purpose: t.purpose || ''
  })))};
  var retention = ${JSON.stringify({ period: retention.period || '', justification: retention.justification || '', autoDelete: !!retention.autoDelete })};
  var withdrawal = ${JSON.stringify({ method: withdrawal.method || '', rightsLink: withdrawal.rightsLink || '', processingTimeline: withdrawal.processingTimeline || '' })};
  var dataPrincipal = ${JSON.stringify(dataPrincipal)};
  var validityDuration = ${JSON.stringify(validityDuration || '')};
  var supportedLanguages = ${JSON.stringify(supportedLanguages)};
  var currentLanguage = config.defaultLanguage || 'en';
  var logoUrl = '${logoUrl}';
  
  var originalConfig = JSON.parse(JSON.stringify(config));
  var originalPurposes = JSON.parse(JSON.stringify(purposes));
  var originalDataCategories = JSON.parse(JSON.stringify(dataCategories));
  var originalThirdParties = JSON.parse(JSON.stringify(thirdParties));
  var originalRetention = JSON.parse(JSON.stringify(retention));
  var originalWithdrawal = JSON.parse(JSON.stringify(withdrawal));
  var originalValidityDuration = JSON.parse(JSON.stringify(validityDuration));
  var originalDataPrincipal = JSON.parse(JSON.stringify(dataPrincipal));

  console.log('Proteccio: Loaded ' + purposes.length + ' purposes');

  // ─── STYLES ──────────────────────────────────────────────
  var themeColor = config.themeColor || '#10b981';
  var bgColor = config.backgroundColor || '#ffffff';
  var textColor = config.textColor || '#111827';
  var btnTextColor = config.buttonTextColor || '#ffffff';
  var borderRadius = (config.borderRadius || 12) + 'px';
  var fontSize = (config.fontSize || 14) + 'px';

  // ─── HELPERS ─────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('proteccio-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'proteccio-consent-styles';
    var css = '';
    
    // Base Overlay Styles
    css += '#proteccio-consent-overlay { position: fixed; z-index: 999998; display: flex; opacity: 0; transition: opacity 0.3s ease; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }';
    
    // Display Mode Logic
    if (config.displayMode === 'SIDEBAR') {
      css += '#proteccio-consent-overlay { top: 0; bottom: 0; ' + (config.position === 'left' ? 'left: 0;' : 'right: 0;') + ' width: 400px; background: rgba(0,0,0,0.3); justify-content: ' + (config.position === 'left' ? 'flex-start' : 'flex-end') + '; }';
      css += '#proteccio-consent-widget { height: 100%; width: 100%; border-radius: 0; transform: translateX(' + (config.position === 'left' ? '-100%' : '100%') + '); }';
    } else if (config.displayMode === 'BOTTOM_BAR') {
      css += '#proteccio-consent-overlay { left: 0; right: 0; bottom: 0; background: transparent; pointer-events: none; }';
      css += '#proteccio-consent-widget { width: 100%; max-width: 100%; border-radius: 0; border-top: 1px solid rgba(0,0,0,0.1); transform: translateY(100%); pointer-events: auto; }';
    } else if (config.displayMode === 'FLOATING') {
      css += '#proteccio-consent-overlay { bottom: 24px; ' + (config.position === 'left' ? 'left: 24px;' : 'right: 24px;') + ' background: transparent; }';
      css += '#proteccio-consent-widget { width: 380px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); transform: translateY(40px) scale(0.9); }';
    } else { // POPUP (Default)
      css += '#proteccio-consent-overlay { top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); align-items: center; justify-content: center; }';
      css += '#proteccio-consent-widget { width: 92%; max-width: 520px; transform: translateY(20px) scale(0.95); }';
    }

    css += '#proteccio-consent-overlay.proteccio-visible { opacity: 1; }';
    css += '#proteccio-consent-widget { background: ' + bgColor + '; color: ' + textColor + '; border-radius: ' + (config.displayMode === 'POPUP' || config.displayMode === 'FLOATING' ? borderRadius : '0') + '; box-shadow: 0 25px 60px rgba(0,0,0,0.15); padding: 32px; transition: all 0.4s cubic-bezier(0.16,1,0.3,1); max-height: 100vh; overflow-y: auto; position: relative; }';
    css += '#proteccio-consent-overlay.proteccio-visible #proteccio-consent-widget { transform: none; }';
    
    // Rest of existing styles...
    css += '.proteccio-logo { height: 28px; object-fit: contain; margin-bottom: 16px; }';
    css += '.proteccio-heading { margin: 0 0 8px; font-size: ' + (parseInt(fontSize) + 4) + 'px; font-weight: 700; color: ' + textColor + '; }';
    css += '.proteccio-desc { margin: 0 0 20px; font-size: ' + fontSize + '; line-height: 1.6; opacity: 0.8; color: ' + textColor + '; }';
    css += '.proteccio-fields { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }';
    css += '.proteccio-field input { width: 100%; padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 8px; font-size: 13px; outline: none; background: transparent; color: ' + textColor + '; transition: border-color 0.2s; box-sizing: border-box; }';
    css += '.proteccio-field input:focus { border-color: ' + themeColor + '; }';
    css += '.proteccio-field input::placeholder { color: ' + textColor + '; opacity: 0.4; }';
    css += '.proteccio-purposes { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }';
    css += '.proteccio-purpose { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.02); transition: background 0.2s; }';
    css += '.proteccio-purpose:hover { background: rgba(0,0,0,0.04); }';
    css += '.proteccio-purpose-toggle { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; margin-top: 1px; }';
    css += '.proteccio-purpose-toggle input { opacity: 0; width: 0; height: 0; }';
    css += '.proteccio-purpose-toggle .proteccio-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.12); transition: 0.3s; border-radius: 22px; }';
    css += '.proteccio-purpose-toggle .proteccio-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; }';
    css += '.proteccio-purpose-toggle input:checked + .proteccio-slider { background-color: ' + themeColor + '; }';
    css += '.proteccio-purpose-toggle input:checked + .proteccio-slider:before { transform: translateX(18px); }';
    css += '.proteccio-purpose-info { flex: 1; }';
    css += '.proteccio-purpose-name { font-weight: 600; font-size: 13px; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }';
    css += '.proteccio-purpose-desc { font-size: 12px; opacity: 0.65; line-height: 1.4; }';
    css += '.proteccio-required-badge { font-size: 9px; background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }';
    css += '.proteccio-privacy-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: ' + themeColor + '; text-decoration: none; margin-bottom: 20px; font-weight: 500; }';
    css += '.proteccio-privacy-link:hover { text-decoration: underline; }';
    css += '.proteccio-actions { display: flex; gap: 10px; flex-wrap: wrap; }';
    css += '.proteccio-btn { flex: 1; padding: 11px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; border: none; min-width: 100px; }';
    css += '.proteccio-btn:hover { opacity: 0.9; transform: translateY(-1px); }';
    css += '.proteccio-btn:active { transform: translateY(0); }';
    css += '.proteccio-btn-primary { background: ' + themeColor + '; color: ' + btnTextColor + '; box-shadow: 0 4px 14px ' + themeColor + '40; }';
    css += '.proteccio-btn-secondary { background: rgba(0,0,0,0.05); color: ' + textColor + '; border: 1px solid rgba(0,0,0,0.1); }';
    css += '.proteccio-powered { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 20px; font-size: 9px; opacity: 0.5; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: ' + textColor + '; }';
    css += '.proteccio-powered img { height: 11px; }';
    css += '.proteccio-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; cursor: pointer; color: ' + textColor + '; opacity: 0.4; font-size: 20px; line-height: 1; padding: 4px; transition: opacity 0.2s; }';
    css += '.proteccio-close:hover { opacity: 0.8; }';
    css += '.proteccio-error { color: #ef4444; font-size: 12px; margin-top: -8px; margin-bottom: 8px; display: none; }';
    
    // Details Section Styling
    css += '.proteccio-details { margin-bottom: 24px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 20px; }';
    css += '.proteccio-details-section { margin-bottom: 16px; }';
    css += '.proteccio-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.5; margin-bottom: 8px; }';
    css += '.proteccio-data-list { display: flex; flex-wrap: wrap; gap: 6px; }';
    css += '.proteccio-tag { background: rgba(0,0,0,0.05); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; }';
    css += '.proteccio-tp-list { margin: 0; padding: 0 0 0 0; list-style: none; font-size: 12px; opacity: 0.8; line-height: 1.5; }';
    css += '.proteccio-tp-list li { margin-bottom: 6px; padding: 6px 10px; background: rgba(0,0,0,0.03); border-radius: 6px; }';
    css += '.proteccio-info-row { display: flex; gap: 8px; font-size: 12px; margin-bottom: 4px; }';
    css += '.proteccio-info-label { opacity: 0.55; flex-shrink: 0; }';
    css += '.proteccio-info-value { font-weight: 500; }';
    css += '.proteccio-retention-text { font-size: 12px; opacity: 0.75; line-height: 1.5; margin-top: 4px; }';
    css += '.proteccio-rights-link { font-size: 12px; color: ' + themeColor + '; text-decoration: none; font-weight: 500; }';
    css += '.proteccio-rights-link:hover { text-decoration: underline; }';
    // Language Dropdown
    css += '.proteccio-lang-bar { display: flex; justify-content: flex-end; margin-bottom: 12px; }';
    css += '.proteccio-lang-select { font-size: 12px; padding: 4px 8px; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; background: rgba(0,0,0,0.03); color: ' + textColor + '; cursor: pointer; outline: none; }';
    css += '.proteccio-lang-select:focus { border-color: ' + themeColor + '; }';

    if (config.customCss) css += config.customCss;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ─── BUILD WIDGET HTML ───────────────────────────────────
  function buildWidget() {
    var fieldsHtml = '';
    if (config.collectName) {
      fieldsHtml += '<div class="proteccio-field"><input type="text" id="proteccio-name" placeholder="Your Name" autocomplete="name"></div>';
    }
    if (config.collectEmail) {
      fieldsHtml += '<div class="proteccio-field"><input type="email" id="proteccio-email" placeholder="Email Address" autocomplete="email" required></div>';
      fieldsHtml += '<div class="proteccio-error" id="proteccio-email-error">Please enter a valid email address</div>';
    }
    if (config.collectPhone) {
      fieldsHtml += '<div class="proteccio-field"><input type="tel" id="proteccio-phone" placeholder="Phone Number" autocomplete="tel"></div>';
    }

    var requiredText = (window.proteccioTranslations && window.proteccioTranslations.required) || 'Required';
    var purposesHtml = purposes.map(function(p) {
      var isRequired = p.necessity === 'ESSENTIAL' || config.requireAllPurposes;
      return '<div class="proteccio-purpose">' +
        '<label class="proteccio-purpose-toggle">' +
          '<input type="checkbox" data-purpose-id="' + p.id + '" data-purpose-name="' + p.name + '" ' +
          (isRequired ? 'checked disabled' : '') + '>' +
          '<span class="proteccio-slider"></span>' +
        '</label>' +
        '<div class="proteccio-purpose-info">' +
          '<div class="proteccio-purpose-name">' + p.name +
          (isRequired ? ' <span class="proteccio-required-badge">' + requiredText + '</span>' : '') +
          '</div>' +
          '<div class="proteccio-purpose-desc">' + (p.description || '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var privacyHtml = '';
    if (config.showPrivacyLink && config.privacyPolicyUrl) {
      privacyHtml = '<a class="proteccio-privacy-link" href="' + config.privacyPolicyUrl + '" target="_blank" rel="noopener">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
        'Read our Privacy Policy</a>';
    }

    // Language Dropdown HTML
    var langHtml = '';
    if (supportedLanguages.length > 1) {
      var langOptions = supportedLanguages.map(function(l) {
        var labels = { en: '🇬🇧 English', hi: '🇮🇳 Hindi', ta: '🇮🇳 Tamil', te: '🇮🇳 Telugu', mr: '🇮🇳 Marathi', bn: '🇮🇳 Bengali', gu: '🇮🇳 Gujarati', kn: '🇮🇳 Kannada', ml: '🇮🇳 Malayalam', pa: '🇮🇳 Punjabi' };
        var label = labels[l] || l.toUpperCase();
        return '<option value="' + l + '"' + (l === currentLanguage ? ' selected' : '') + '>' + label + '</option>';
      }).join('');
      langHtml = '<div class="proteccio-lang-bar"><select class="proteccio-lang-select" id="proteccio-lang-select" aria-label="Language">' + langOptions + '</select></div>';
    }

    var dataAttributesText = (window.proteccioTranslations && window.proteccioTranslations.dataAttributes) || 'Data Attributes';
    var dataHtml = '';
    if (dataCategories.length > 0) {
      dataHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + dataAttributesText + '</div>' +
        '<div class="proteccio-data-list">' +
          dataCategories.map(function(c) { 
            return '<span class="proteccio-tag">' + (c.label || c.category) + (c.mandatory ? ' ✦' : '') + '</span>'; 
          }).join('') +
        '</div>' +
      '</div>';
    }

    var thirdPartiesText = (window.proteccioTranslations && window.proteccioTranslations.thirdParties) || 'Third Parties';
    var thirdPartyHtml = '';
    if (thirdParties.length > 0) {
      thirdPartyHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + thirdPartiesText + '</div>' +
        '<ul class="proteccio-tp-list">' +
          thirdParties.map(function(t) {
            var detail = t.role ? ' (' + t.role + ')' : '';
            var country = t.country ? ' — ' + t.country : '';
            var purposeText = t.purpose ? '<br><span style="opacity:0.65">' + t.purpose + '</span>' : '';
            return '<li><strong>' + t.name + '</strong>' + detail + country + purposeText + '</li>';
          }).join('') +
        '</ul>' +
      '</div>';
    }

    var consentValidityText = (window.proteccioTranslations && window.proteccioTranslations.consentValidity) || 'Consent Validity';
    var durationText = (window.proteccioTranslations && window.proteccioTranslations.duration) || 'Duration';
    // Validity section
    var validityHtml = '';
    if (validityDuration) {
      validityHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + consentValidityText + '</div>' +
        '<div class="proteccio-info-row"><span class="proteccio-info-label">' + durationText + ':</span><span class="proteccio-info-value">' + validityDuration + '</span></div>' +
      '</div>';
    }

    var dataPrincipalText = (window.proteccioTranslations && window.proteccioTranslations.dataPrincipal) || 'Data Principal';
    var categoryText = (window.proteccioTranslations && window.proteccioTranslations.category) || 'Category';
    var ageThresholdText = (window.proteccioTranslations && window.proteccioTranslations.ageThreshold) || 'Age Threshold';
    var givenByText = (window.proteccioTranslations && window.proteccioTranslations.givenBy) || 'Given By';
    var yearsText = (window.proteccioTranslations && window.proteccioTranslations.years) || 'years';
    // Data Principal section
    var principalHtml = '';
    if (dataPrincipal.targetUserCategory || dataPrincipal.ageThreshold) {
      principalHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + dataPrincipalText + '</div>' +
        (dataPrincipal.targetUserCategory ? '<div class="proteccio-info-row"><span class="proteccio-info-label">' + categoryText + ':</span><span class="proteccio-info-value">' + dataPrincipal.targetUserCategory + '</span></div>' : '') +
        (dataPrincipal.ageThreshold ? '<div class="proteccio-info-row"><span class="proteccio-info-label">' + ageThresholdText + ':</span><span class="proteccio-info-value">' + dataPrincipal.ageThreshold + '+ ' + yearsText + '</span></div>' : '') +
        (dataPrincipal.consentGivenBy ? '<div class="proteccio-info-row"><span class="proteccio-info-label">' + givenByText + ':</span><span class="proteccio-info-value">' + dataPrincipal.consentGivenBy + '</span></div>' : '') +
      '</div>';
    }

    var dataRetentionText = (window.proteccioTranslations && window.proteccioTranslations.dataRetention) || 'Data Retention';
    var periodText = (window.proteccioTranslations && window.proteccioTranslations.period) || 'Period';
    var autoDeleteText = (window.proteccioTranslations && window.proteccioTranslations.autoDelete) || 'Auto-Delete';
    var yesText = (window.proteccioTranslations && window.proteccioTranslations.yes) || 'Yes';
    // Retention section
    var retentionHtml = '';
    if (retention.period) {
      retentionHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + dataRetentionText + '</div>' +
        '<div class="proteccio-info-row"><span class="proteccio-info-label">' + periodText + ':</span><span class="proteccio-info-value">' + retention.period + '</span></div>' +
        (retention.autoDelete ? '<div class="proteccio-info-row"><span class="proteccio-info-label">' + autoDeleteText + ':</span><span class="proteccio-info-value">' + yesText + '</span></div>' : '') +
        (retention.justification ? '<p class="proteccio-retention-text">' + retention.justification + '</p>' : '') +
      '</div>';
    }

    var rightsWithdrawalText = (window.proteccioTranslations && window.proteccioTranslations.rightsWithdrawal) || 'Your Rights & Withdrawal';
    var manageRightsText = (window.proteccioTranslations && window.proteccioTranslations.manageRights) || 'Manage your privacy rights';
    // Rights & Withdrawal section
    var withdrawalHtml = '';
    if (withdrawal.method || withdrawal.rightsLink) {
      withdrawalHtml = '<div class="proteccio-details-section">' +
        '<div class="proteccio-section-title">' + rightsWithdrawalText + '</div>' +
        (withdrawal.method ? '<p class="proteccio-retention-text">' + withdrawal.method + '</p>' : '') +
        (withdrawal.rightsLink ? '<br><a class="proteccio-rights-link" href="' + withdrawal.rightsLink + '" target="_blank" rel="noopener">⟶ ' + manageRightsText + '</a>' : '') +
      '</div>';
    }

    var hasDetails = dataHtml || thirdPartyHtml || validityHtml || principalHtml || retentionHtml || withdrawalHtml;

    return '<div id="proteccio-consent-overlay" role="dialog" aria-modal="true" aria-labelledby="proteccio-consent-heading">' +
      '<div id="proteccio-consent-widget">' +
        '<button class="proteccio-close" aria-label="Close" id="proteccio-close-btn">&times;</button>' +
        langHtml +
        (logoUrl ? '<img class="proteccio-logo" src="' + logoUrl + '" alt="Logo" onerror="this.style.display=\\\'none\\\'">' : '') +
        '<h2 class="proteccio-heading" id="proteccio-consent-heading">' + (config.heading || 'We value your privacy') + '</h2>' +
        (config.description ? '<p class="proteccio-desc">' + config.description + '</p>' : '') +
        (fieldsHtml ? '<div class="proteccio-fields">' + fieldsHtml + '</div>' : '') +
        (purposesHtml ? '<div class="proteccio-purposes">' + purposesHtml + '</div>' : '') +
        (hasDetails ? '<div class="proteccio-details">' + validityHtml + principalHtml + dataHtml + thirdPartyHtml + retentionHtml + withdrawalHtml + '</div>' : '') +
        privacyHtml +
        '<div class="proteccio-actions">' +
          '<button class="proteccio-btn proteccio-btn-secondary" id="proteccio-reject-btn">' + (config.rejectAllText || 'Reject All') + '</button>' +
          (purposes.length > 1 ? '<button class="proteccio-btn proteccio-btn-secondary" id="proteccio-save-btn">' + (config.savePrefsText || 'Save Preferences') + '</button>' : '') +
          '<button class="proteccio-btn proteccio-btn-primary" id="proteccio-accept-btn">' + (config.acceptAllText || 'Accept All') + '</button>' +
        '</div>' +
        '<div class="proteccio-powered"><span>Powered by</span><img src="' + logoUrl + '" alt="Proteccio"></div>' +
      '</div>' +
    '</div>';
  }

  // ─── SHOW / HIDE ─────────────────────────────────────────
  function showWidget() {
    if (document.getElementById('proteccio-consent-overlay')) return;
    injectStyles();

    var container = document.createElement('div');
    container.innerHTML = buildWidget();
    document.body.appendChild(container.firstElementChild);

    // Animate in
    requestAnimationFrame(function() {
      var overlay = document.getElementById('proteccio-consent-overlay');
      if (overlay) overlay.classList.add('proteccio-visible');
    });

    // Bind events
    bindEvents();
  }

  function hideWidget() {
    var overlay = document.getElementById('proteccio-consent-overlay');
    if (!overlay) return;
    overlay.classList.remove('proteccio-visible');
    setTimeout(function() { overlay.remove(); }, 300);
  }

  // ─── EVENT BINDING ───────────────────────────────────────
  function bindEvents() {
    var closeBtn = document.getElementById('proteccio-close-btn');
    var acceptBtn = document.getElementById('proteccio-accept-btn');
    var rejectBtn = document.getElementById('proteccio-reject-btn');
    var saveBtn = document.getElementById('proteccio-save-btn');

    if (closeBtn) closeBtn.onclick = hideWidget;
    if (acceptBtn) acceptBtn.onclick = function() { submitConsent('accept_all'); };
    if (rejectBtn) rejectBtn.onclick = function() { submitConsent('reject_all'); };
    if (saveBtn) saveBtn.onclick = function() { submitConsent('save_preferences'); };

    // Language switcher
    var langSelect = document.getElementById('proteccio-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', async function() {
        var targetLang = langSelect.value;
        currentLanguage = targetLang;

        if (targetLang === (originalConfig.defaultLanguage || 'en')) {
           // Reset to original
           config = JSON.parse(JSON.stringify(originalConfig));
           purposes = JSON.parse(JSON.stringify(originalPurposes));
           dataCategories = JSON.parse(JSON.stringify(originalDataCategories));
           thirdParties = JSON.parse(JSON.stringify(originalThirdParties));
           retention = JSON.parse(JSON.stringify(originalRetention));
           withdrawal = JSON.parse(JSON.stringify(originalWithdrawal));
           validityDuration = JSON.parse(JSON.stringify(originalValidityDuration));
           dataPrincipal = JSON.parse(JSON.stringify(originalDataPrincipal));
           
           // Clear cached translations so labels revert to English defaults
           window.proteccioTranslations = null;
           
           hideWidget();
           setTimeout(showWidget, 350);
           return;
        }

        langSelect.disabled = true;
        langSelect.style.opacity = '0.5';

        // Collect all texts to translate
        var texts = [];
        texts.push(originalConfig.heading || 'We value your privacy');
        texts.push(originalConfig.description || '');
        texts.push(originalConfig.rejectAllText || 'Reject All');
        texts.push(originalConfig.savePrefsText || 'Save Preferences');
        texts.push(originalConfig.acceptAllText || 'Accept All');
        texts.push(originalRetention.justification || '');
        texts.push(originalWithdrawal.method || '');
        texts.push(originalRetention.period || '');
        texts.push(originalValidityDuration || '');
        texts.push(originalDataPrincipal.targetUserCategory || '');
        texts.push(originalDataPrincipal.consentGivenBy || '');
        
        originalPurposes.forEach(function(p) {
           texts.push(p.name || '');
           texts.push(p.description || '');
        });
        
        originalDataCategories.forEach(function(c) {
           texts.push(c.label || c.category || '');
        });

        originalThirdParties.forEach(function(t) {
           texts.push(t.name || '');
           texts.push(t.purpose || '');
           texts.push(t.role || '');
           texts.push(t.country || '');
        });

        texts.push('Required');
        texts.push('Data Attributes');
        texts.push('Third Parties');
        texts.push('Consent Validity');
        texts.push('Data Principal');
        texts.push('Data Retention');
        texts.push('Your Rights & Withdrawal');
        texts.push('Duration');
        texts.push('Category');
        texts.push('Age Threshold');
        texts.push('Given By');
        texts.push('years');
        texts.push('Period');
        texts.push('Auto-Delete');
        texts.push('Yes');
        texts.push('Manage your privacy rights');

        // Ensure no nulls
        texts = texts.map(t => t || ' ');

        try {
          const response = await fetch(config.baseUrl + '/api/v1/public/translation/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: texts,
              sourceLang: 'en',
              targetLang: targetLang
            })
          });
          
          const result = await response.json();
          if (result.success && result.data) {
             var t = result.data;
             var idx = 0;
             config.heading = t[idx++];
             config.description = t[idx++];
             config.rejectAllText = t[idx++];
             config.savePrefsText = t[idx++];
             config.acceptAllText = t[idx++];
             retention.justification = t[idx++];
             withdrawal.method = t[idx++];
             retention.period = t[idx++];
             validityDuration = t[idx++];
             dataPrincipal.targetUserCategory = t[idx++];
             dataPrincipal.consentGivenBy = t[idx++];
             
             purposes.forEach(function(p) {
               p.name = t[idx++];
               p.description = t[idx++];
             });

             dataCategories.forEach(function(c) {
               c.label = t[idx++];
             });

             thirdParties.forEach(function(tp) {
               tp.name = t[idx++];
               tp.purpose = t[idx++];
               tp.role = t[idx++];
               tp.country = t[idx++];
             });

             window.proteccioTranslations = window.proteccioTranslations || {};
             window.proteccioTranslations.required = t[idx++];
             window.proteccioTranslations.dataAttributes = t[idx++];
             window.proteccioTranslations.thirdParties = t[idx++];
             window.proteccioTranslations.consentValidity = t[idx++];
             window.proteccioTranslations.dataPrincipal = t[idx++];
             window.proteccioTranslations.dataRetention = t[idx++];
             window.proteccioTranslations.rightsWithdrawal = t[idx++];
             window.proteccioTranslations.duration = t[idx++];
             window.proteccioTranslations.category = t[idx++];
             window.proteccioTranslations.ageThreshold = t[idx++];
             window.proteccioTranslations.givenBy = t[idx++];
             window.proteccioTranslations.years = t[idx++];
             window.proteccioTranslations.period = t[idx++];
             window.proteccioTranslations.autoDelete = t[idx++];
             window.proteccioTranslations.yes = t[idx++];
             window.proteccioTranslations.manageRights = t[idx++];
          }
        } catch(err) {
          console.error('Proteccio translation failed:', err);
        }

        langSelect.disabled = false;
        langSelect.style.opacity = '1';

        hideWidget();
        setTimeout(showWidget, 350);
      });
    }

    // Close on overlay click (outside widget)
    var overlay = document.getElementById('proteccio-consent-overlay');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) hideWidget();
      });
    }
  }

  // ─── COLLECT DATA & SUBMIT ───────────────────────────────
  function getFormData() {
    var data = { purposes: [], name: null, email: null, phone: null };

    var nameEl = document.getElementById('proteccio-name');
    if (nameEl) data.name = nameEl.value.trim();

    var emailEl = document.getElementById('proteccio-email');
    if (emailEl) data.email = emailEl.value.trim();

    var phoneEl = document.getElementById('proteccio-phone');
    if (phoneEl) data.phone = phoneEl.value.trim();

    return data;
  }

  function validateForm(data) {
    if (config.collectEmail && !data.email) {
      var errEl = document.getElementById('proteccio-email-error');
      if (errEl) errEl.style.display = 'block';
      return false;
    }
    if (data.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) {
      var errEl = document.getElementById('proteccio-email-error');
      if (errEl) errEl.style.display = 'block';
      return false;
    }
    return true;
  }

  function submitConsent(action) {
    var data = getFormData();

    // Determine selected purposes
    if (action === 'accept_all') {
      data.purposes = purposes.map(function(p) { return p.name; });
    } else if (action === 'reject_all') {
      data.purposes = purposes.filter(function(p) { return p.necessity === 'ESSENTIAL'; }).map(function(p) { return p.name; });
    } else {
      // save_preferences → get checked toggles
      var toggles = document.querySelectorAll('#proteccio-consent-widget input[data-purpose-id]');
      toggles.forEach(function(t) {
        if (t.checked) data.purposes.push(t.getAttribute('data-purpose-name'));
      });
    }

    // Validate
    if (!validateForm(data)) return;

    // Store locally
    var consentData = {
      status: action === 'reject_all' ? 'rejected' : (action === 'accept_all' ? 'accepted_all' : 'accepted'),
      purposes: data.purposes,
      timestamp: new Date().toISOString(),
      email: data.email,
    };
    // Persistence removed by developer request - every submission requires fresh consent
    // try { localStorage.setItem('proteccio-consent-widget', JSON.stringify(consentData)); } catch(e) {}

    // Disable buttons during submit
    var btns = document.querySelectorAll('.proteccio-btn');
    btns.forEach(function(b) { b.disabled = true; b.style.opacity = '0.6'; });

    // Send to backend
    fetch(config.baseUrl + '/api/v1/public/consent/record/' + config.applicationId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        purposes: data.purposes,
        language: currentLanguage || config.defaultLanguage || 'en',
        userAgent: navigator.userAgent,
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(result) {
      // Fire callback
      if (window.ProteccioConsent && window.ProteccioConsent._onConsentCallback) {
        window.ProteccioConsent._onConsentCallback({
          status: consentData.status,
          purposes: data.purposes,
          email: data.email,
          name: data.name,
          recordId: result.recordId,
        });
      }

      // Push to dataLayer (GTM integration)
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'proteccio_consent_widget',
        consent_status: consentData.status,
        consent_purposes: data.purposes,
      });

      hideWidget();
    })
    .catch(function(err) {
      console.error('Proteccio: Failed to record consent', err);
      // Still hide and fire callback on error (graceful degradation)
      if (window.ProteccioConsent && window.ProteccioConsent._onConsentCallback) {
        window.ProteccioConsent._onConsentCallback({ status: consentData.status, purposes: data.purposes, error: true });
      }
      hideWidget();
    });
  }

  // ─── FORM INTERCEPT ──────────────────────────────────────
  function interceptForm(formSelector) {
    var form = document.querySelector(formSelector);
    if (!form) {
      console.warn('Proteccio: Form not found:', formSelector);
      return;
    }

    form.addEventListener('submit', function(e) {
      var existing = null;
      try { existing = JSON.parse(localStorage.getItem('proteccio-consent-widget')); } catch(ex) {}
      if (existing && existing.status === 'accepted') return; // Already consented

      e.preventDefault();
      e.stopPropagation();

      // Show consent widget, then submit form on consent
      window.ProteccioConsent._onConsentCallback = function() {
        form.submit();
      };
      showWidget();
    });
  }

  // ─── INLINE RENDER ───────────────────────────────────────
  function renderInline(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      console.warn('Proteccio: Container not found:', containerSelector);
      return;
    }

    injectStyles();
    // Build widget without overlay for inline mode
    var widgetHtml = buildWidget();
    var temp = document.createElement('div');
    temp.innerHTML = widgetHtml;
    var widgetEl = temp.querySelector('#proteccio-consent-widget');
    if (widgetEl) {
      widgetEl.style.position = 'relative';
      widgetEl.style.maxWidth = '100%';
      widgetEl.style.boxShadow = 'none';
      widgetEl.style.border = '1px solid rgba(0,0,0,0.08)';
      widgetEl.style.transform = 'none';
      container.appendChild(widgetEl);

      // Close button not needed in inline mode
      var closeBtn = widgetEl.querySelector('.proteccio-close');
      if (closeBtn) closeBtn.style.display = 'none';

      // Bind events for inline
      var acceptBtn = widgetEl.querySelector('#proteccio-accept-btn');
      var rejectBtn = widgetEl.querySelector('#proteccio-reject-btn');
      var saveBtn = widgetEl.querySelector('#proteccio-save-btn');
      if (acceptBtn) acceptBtn.onclick = function() { submitConsent('accept_all'); };
      if (rejectBtn) rejectBtn.onclick = function() { submitConsent('reject_all'); };
      if (saveBtn) saveBtn.onclick = function() { submitConsent('save_preferences'); };
    }
  }

  // ─── CONSENT STATUS CHECK ────────────────────────────────
  function checkConsent(identifier) {
    return fetch(config.baseUrl + '/api/v1/public/consent/status/' + config.applicationId + '/' + encodeURIComponent(identifier))
      .then(function(res) { return res.json(); })
      .catch(function() { return { hasConsent: false }; });
  }

  // ─── WITHDRAW ────────────────────────────────────────────
  function withdrawConsent(identifier) {
    try { localStorage.removeItem('proteccio-consent-widget'); } catch(e) {}
    return fetch(config.baseUrl + '/api/v1/public/consent/withdraw/' + config.applicationId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier })
    })
    .then(function(res) { return res.json(); })
    .catch(function(err) { console.error('Proteccio: Withdraw failed', err); });
  }

  // ─── LOAD FONTS ──────────────────────────────────────────
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // ─── GLOBAL API ──────────────────────────────────────────
  window.ProteccioConsent = window.ProteccioConsent || {};
  window.ProteccioConsent.show = showWidget;
  window.ProteccioConsent.hide = hideWidget;
  window.ProteccioConsent.check = checkConsent;
  window.ProteccioConsent.withdraw = withdrawConsent;
  window.ProteccioConsent.onFormSubmit = interceptForm;
  window.ProteccioConsent.renderInline = renderInline;
  window.ProteccioConsent.onConsent = function(cb) { window.ProteccioConsent._onConsentCallback = cb; };
  window.ProteccioConsent._onConsentCallback = null;

  // ─── AUTO-TRIGGER ────────────────────────────────────────
  function autoTrigger() {
    // Persistence check removed - auto-trigger will now always run if configured

    if (config.trigger === 'PAGE_LOAD') {
      showWidget();
    } else if (config.trigger === 'SCROLL') {
      var triggered = false;
      window.addEventListener('scroll', function() {
        if (triggered) return;
        var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 30) {
          triggered = true;
          showWidget();
        }
      });
    } else if (config.trigger === 'BUTTON_CLICK') {
      document.addEventListener('click', function(e) {
        var target = e.target.closest('[data-proteccio-show]');
        if (target) {
          e.preventDefault();
          showWidget();
        }
      });
    }
    // MANUAL and BUTTON_CLICK triggers are handled by the website owner calling ProteccioConsent.show()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoTrigger);
  } else {
    autoTrigger();
  }
})();
    `;
  }

  /**
   * Records consent submitted from the widget.
   */
  @Post('record/:applicationId')
  async recordConsent(
    @Param('applicationId') applicationId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIp = req.headers['x-real-ip'];
    const cfIp = req.headers['cf-connecting-ip'];

    let rawIp = cfIp || xRealIp || xForwardedFor || req.ip || req.socket?.remoteAddress;
    let ip = '';
    if (typeof rawIp === 'string') {
      ip = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');
    }

    return this.widgetService.recordPublicConsent(applicationId, { ...dto, ipAddress: ip });
  }

  /**
   * Checks if a user has already given consent.
   */
  @Get('status/:applicationId/:identifier')
  async checkStatus(
    @Param('applicationId') applicationId: string,
    @Param('identifier') identifier: string,
  ) {
    return this.widgetService.checkConsentStatus(applicationId, identifier);
  }

  /**
   * Allows a user to withdraw consent.
   */
  @Post('withdraw/:applicationId')
  async withdrawConsent(
    @Param('applicationId') applicationId: string,
    @Body() dto: { identifier: string },
  ) {
    return this.widgetService.withdrawConsent(applicationId, dto.identifier);
  }
}
