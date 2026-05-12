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
    const purposes = (widget.template as any)?.purposes || [];
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
  var purposes = ${JSON.stringify(purposes.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isPrimary: p.isPrimary,
    necessity: p.necessity,
  })))};
  var logoUrl = '${logoUrl}';

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
    css += '#proteccio-consent-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 999998; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }';
    css += '#proteccio-consent-overlay.proteccio-visible { opacity: 1; }';
    css += '#proteccio-consent-widget { background: ' + bgColor + '; color: ' + textColor + '; border-radius: ' + borderRadius + '; max-width: 520px; width: 92%; box-shadow: 0 25px 60px rgba(0,0,0,0.15); padding: 32px; transform: translateY(20px) scale(0.95); transition: all 0.35s cubic-bezier(0.16,1,0.3,1); max-height: 90vh; overflow-y: auto; position: relative; }';
    css += '#proteccio-consent-overlay.proteccio-visible #proteccio-consent-widget { transform: translateY(0) scale(1); }';
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
          (isRequired ? ' <span class="proteccio-required-badge">Required</span>' : '') +
          '</div>' +
          '<div class="proteccio-purpose-desc">' + (p.description || 'Required for service delivery.') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var privacyHtml = '';
    if (config.showPrivacyLink && config.privacyPolicyUrl) {
      privacyHtml = '<a class="proteccio-privacy-link" href="' + config.privacyPolicyUrl + '" target="_blank" rel="noopener">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
        'Read our Privacy Policy</a>';
    }

    return '<div id="proteccio-consent-overlay" role="dialog" aria-modal="true" aria-labelledby="proteccio-consent-heading">' +
      '<div id="proteccio-consent-widget">' +
        '<button class="proteccio-close" aria-label="Close" id="proteccio-close-btn">&times;</button>' +
        (logoUrl ? '<img class="proteccio-logo" src="' + logoUrl + '" alt="Logo" onerror="this.style.display=\\\'none\\\'">' : '') +
        '<h2 class="proteccio-heading" id="proteccio-consent-heading">' + (config.heading || 'We value your privacy') + '</h2>' +
        (config.description ? '<p class="proteccio-desc">' + config.description + '</p>' : '') +
        (fieldsHtml ? '<div class="proteccio-fields">' + fieldsHtml + '</div>' : '') +
        (purposesHtml ? '<div class="proteccio-purposes">' + purposesHtml + '</div>' : '') +
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
      status: action === 'reject_all' ? 'rejected' : 'accepted',
      purposes: data.purposes,
      timestamp: new Date().toISOString(),
      email: data.email,
    };
    try { localStorage.setItem('proteccio-consent-widget', JSON.stringify(consentData)); } catch(e) {}

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
        language: config.defaultLanguage || 'en',
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
    // Check if already consented
    var existing = null;
    try { existing = JSON.parse(localStorage.getItem('proteccio-consent-widget')); } catch(e) {}
    if (existing && existing.status === 'accepted') return;

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
