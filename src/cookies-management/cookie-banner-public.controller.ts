import { Controller, Get, Post, Body, Param, Header, Request } from '@nestjs/common';
import { CookiesManagementService } from './cookies-management.service';

@Controller('api/v1/public/cookies')
export class CookieBannerPublicController {
  constructor(private readonly cookiesManagementService: CookiesManagementService) {}

  @Get('banner/:websiteId')
  async getBanner(@Param('websiteId') websiteId: string) {
    return this.cookiesManagementService.getPublicBanner(websiteId);
  }

  @Post('consent/:websiteId')
  async recordConsent(@Param('websiteId') websiteId: string, @Body() dto: any, @Request() req: any) {
    // Check multiple headers common with proxies and CDNs
    let ip = 
      req.headers['cf-connecting-ip'] || 
      req.headers['x-real-ip'] || 
      req.headers['x-forwarded-for'] || 
      req.socket.remoteAddress || 
      req.ip;
    
    // If x-forwarded-for is a list, take the first one
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    return this.cookiesManagementService.recordPublicConsent(websiteId, { ...dto, ipAddress: ip });
  }

  @Get('consent-status/:websiteId/:userId')
  async checkStatus(@Param('websiteId') websiteId: string, @Param('userId') userId: string) {
    return this.cookiesManagementService.checkConsentStatus(websiteId, userId);
  }

  @Get('banner-script/:websiteId')
  @Header('Content-Type', 'application/javascript')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getBannerScript(@Param('websiteId') websiteId: string, @Request() req) {
    const banner = await this.cookiesManagementService.getPublicBanner(websiteId);
    
    if (!banner) {
      return `console.warn('Proteccio: No active banner found for website ${websiteId}');`;
    }

    const host = req.get('host');
    const baseUrl = `//${host}`;

    // Extract categories from nested tenant object
    const categories = (banner as any).tenant?.cookieCategories || [];
    
    // Logo and Branding URLs
    const logoUrl = `${baseUrl}/proteccio_logo_new-removebg-preview.png`; 

    // Inject settings into a self-executing script
    return `
(function() {
  const config = ${JSON.stringify(banner)};
  config.websiteId = '${websiteId}';
  config.baseUrl = '${baseUrl}';
  const categories = ${JSON.stringify(categories)};
  const logoUrl = \`\${config.baseUrl}/proteccio_logo_new-removebg-preview.png\`;
  
  let userId = localStorage.getItem('proteccio_user_id');
  if (!userId) {
    userId = 'U-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('proteccio_user_id', userId);
  }

  function initBanner() {
    if (document.getElementById('proteccio-cookie-banner')) return;
    
    const bannerDiv = document.createElement('div');
    bannerDiv.id = 'proteccio-cookie-banner';
    
    const themeColor = config.themeColor || '#10b981';
    const bgColor = config.backgroundColor || '#ffffff';
    const textColor = config.textColor || '#111827';
    const btnTextColor = config.buttonTextColor || '#ffffff';
    const borderRadius = (config.borderRadius ?? 12) + 'px';
    const maxWidth = (config.maxWidth ?? 1200) + 'px';
    const fontSize = (config.fontSize ?? 14) + 'px';
    const padding = (config.padding ?? 24) + 'px';
    const backdropOpacity = (config.backdropOpacity ?? 50) / 100;
    const backdropBlur = (config.backdropBlur ?? 0) + 'px';

    bannerDiv.style.cssText = \`
      position: fixed; 
      z-index: 999999; 
      left: 0; 
      right: 0; 
      font-family: "Inter", sans-serif; 
      transition: all 0.3s ease;
      display: flex;
      justify-content: center;
      pointer-events: none;
    \`;
    
    if (config.position === 'TOP') {
      bannerDiv.style.top = '0';
    } else if (config.position === 'CENTER') {
      bannerDiv.style.top = '0';
      bannerDiv.style.bottom = '0';
      bannerDiv.style.alignItems = 'center';
      bannerDiv.style.backgroundColor = \`rgba(0,0,0,\${backdropOpacity * 0.5})\`;
      bannerDiv.style.backdropFilter = \`blur(\${backdropBlur})\`;
      bannerDiv.style.pointerEvents = 'auto';
    } else if (config.position === 'CORNER') {
      bannerDiv.style.bottom = '20px';
      bannerDiv.style.right = '20px';
      bannerDiv.style.left = 'auto';
      bannerDiv.style.width = 'auto';
    } else {
      bannerDiv.style.bottom = '0';
    }

    const mainView = \`
      <div id="proteccio-main-view" style="
        background: \${bgColor}; 
        color: \${textColor};
        border: 1px solid rgba(0,0,0,0.05); 
        box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
        padding: \${padding};
        width: 100%;
        max-width: \${maxWidth};
        margin: \${config.position === 'CORNER' ? '0' : padding};
        border-radius: \${borderRadius};
        display: flex;
        flex-direction: column;
        gap: 16px;
        pointer-events: auto;
        animation: proteccio-slide-up 0.4s ease-out;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <img src="\${logoUrl}" alt="Proteccio Logo" style="height: 32px; object-fit: contain;" onerror="this.style.display='none'">
          <div style="display: flex; align-items: center; gap: 8px;">
            <select id="proteccio-lang-selector" style="
              background: rgba(255,255,255,0.08); 
              border: 1px solid rgba(255,255,255,0.15); 
              color: \${textColor}; 
              font-size: 12px; 
              padding: 6px 12px; 
              border-radius: 6px; 
              cursor: pointer;
              outline: none;
              font-weight: 500;
            ">
              <option value="en" style="background: \${bgColor}; color: \${textColor};">English</option>
              <option value="hi" style="background: \${bgColor}; color: \${textColor};">हिन्दी</option>
              <option value="es" style="background: \${bgColor}; color: \${textColor};">Español</option>
              <option value="fr" style="background: \${bgColor}; color: \${textColor};">Français</option>
            </select>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <h3 style="margin: 0; font-size: \${parseFloat(fontSize) + 4}px; font-weight: 700; color: \${textColor};">\${config.heading || 'This website uses cookies'}</h3>
          <p style="margin: 0; font-size: \${fontSize}; line-height: 1.6; opacity: 0.9; color: \${textColor};">\${config.description || 'We use cookies to personalise content and ads, to provide social media features and to analyse our traffic.'}</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 12px; margin-top: 8px;">
          <div style="display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; width: 100%;">
            <button id="proteccio-preferences" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: \${textColor}; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: \${fontSize}; transition: all 0.2s;">\${config.settingsButtonText || 'Preferences'}</button>
            <button id="proteccio-reject" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: \${textColor}; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: \${fontSize}; transition: all 0.2s;">\${config.declineButtonText || 'Reject All'}</button>
            <button id="proteccio-accept" style="background: \${themeColor}; color: \${btnTextColor}; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: \${fontSize}; box-shadow: 0 4px 12px \${themeColor}40; transition: all 0.2s; transform: scale(1);">\${config.acceptButtonText || 'Accept All'}</button>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 9px; opacity: 0.6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: \${textColor};">
             <span>Powered by</span>
             <img src="\${logoUrl}" style="height: 12px; margin-left: 2px;">
          </div>
        </div>
      </div>
      <style>
        #proteccio-cookie-banner button:hover { opacity: 0.9; transform: translateY(-1px); }
        #proteccio-cookie-banner button:active { transform: translateY(0); }
        #proteccio-lang-selector option { background: \${bgColor}; color: \${textColor}; }
        @keyframes proteccio-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    \`;

    const preferencesView = \`
      <div id="proteccio-preferences-view" style="
        display: none;
        background: \${bgColor}; 
        color: \${textColor};
        border: 1px solid rgba(0,0,0,0.05); 
        box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
        padding: \${padding};
        width: 100%;
        max-width: \${maxWidth};
        margin: \${config.position === 'CORNER' ? '0' : padding};
        border-radius: \${borderRadius};
        pointer-events: auto;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
          <button id="proteccio-back" style="background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: inherit;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Cookie Preferences</h3>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          \${categories.map(cat => \`
            <div style="display: flex; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-weight: 600; font-size: 15px;">\${cat.name}</span>
                  \${cat.locked ? '<span style="font-size: 10px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Required</span>' : ''}
                </div>
                <p style="margin: 0; font-size: 13px; opacity: 0.7; line-height: 1.5;">\${cat.description || 'Helps the website function correctly.'}</p>
              </div>
              <div style="display: flex; align-items: center;">
                <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" class="proteccio-toggle" \${cat.locked || cat.enabled ? 'checked' : ''} \${cat.locked ? 'disabled' : ''} data-cat-id="\${cat.id}" style="opacity: 0; width: 0; height: 0;">
                  <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: \${cat.locked || cat.enabled ? themeColor : 'rgba(255,255,255,0.1)'}; transition: .3s; border-radius: 24px;"></span>
                  <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; transform: \${cat.locked || cat.enabled ? 'translateX(20px)' : 'translateX(0)'}"></span>
                </label>
              </div>
            </div>
          \`).join('')}
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 32px; gap: 12px;">
          <button id="proteccio-save-prefs" style="background: \${themeColor}; color: \${btnTextColor}; border: none; padding: 12px 32px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%; transition: all 0.2s;">Save Preferences</button>
        </div>
      </div>
    \`;

    bannerDiv.innerHTML = mainView + preferencesView;
    document.body.appendChild(bannerDiv);

    // Toggle Styles logic
    const toggles = document.querySelectorAll('.proteccio-toggle');
    toggles.forEach(t => {
      const slider = t.nextElementSibling;
      const dot = slider.nextElementSibling;
      const updateToggle = () => {
        if (t.checked) {
          slider.style.backgroundColor = themeColor;
          dot.style.transform = 'translateX(20px)';
        } else {
          slider.style.backgroundColor = '#ccc';
          dot.style.transform = 'translateX(0px)';
        }
      };
      t.addEventListener('change', updateToggle);
      updateToggle(); // Init
    });

    // View Switching
    document.getElementById('proteccio-preferences').onclick = () => {
      document.getElementById('proteccio-main-view').style.display = 'none';
      document.getElementById('proteccio-preferences-view').style.display = 'block';
    };

    document.getElementById('proteccio-back').onclick = () => {
      document.getElementById('proteccio-main-view').style.display = 'flex';
      document.getElementById('proteccio-preferences-view').style.display = 'none';
    };

    // Actions
    const setConsent = (status, selectedCats = null) => {
      const activeCategories = selectedCats || categories.filter(c => c.locked || c.enabled).map(c => c.name);
      const consentData = {
        status,
        timestamp: new Date().toISOString(),
        categories: activeCategories,
        userId: userId
      };
      localStorage.setItem('proteccio-consent', JSON.stringify(consentData));

      // GTM & DataLayer Integration
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'proteccio_consent_update',
        consent_status: status,
        consent_categories: activeCategories,
        ad_storage: activeCategories.includes('ADVERTISING') ? 'granted' : 'denied',
        analytics_storage: activeCategories.includes('ANALYTICS') ? 'granted' : 'denied',
        functionality_storage: activeCategories.includes('FUNCTIONAL') ? 'granted' : 'denied',
        personalization_storage: activeCategories.includes('FUNCTIONAL') ? 'granted' : 'denied',
        security_storage: 'granted'
      });

      bannerDiv.style.opacity = '0';
      bannerDiv.style.transform = 'translateY(20px)';
      
      fetch(\`\${config.baseUrl}/api/v1/public/cookies/consent/\${config.websiteId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentData)
      }).catch(err => console.error('Proteccio: Failed to save consent', err));

      setTimeout(() => bannerDiv.remove(), 300);
    };

    document.getElementById('proteccio-accept').onclick = () => {
      setConsent('accepted', categories.map(c => c.name));
    };
    
    document.getElementById('proteccio-reject').onclick = () => {
      setConsent('rejected', categories.filter(c => c.locked).map(c => c.name));
    };

    document.getElementById('proteccio-save-prefs').onclick = () => {
      const activeCats = [];
      document.querySelectorAll('.proteccio-toggle').forEach(t => {
        if (t.checked) {
          const catId = t.getAttribute('data-cat-id');
          const cat = categories.find(c => c.id === catId);
          if (cat) activeCats.push(cat.name);
        }
      });
      setConsent('accepted', activeCats);
    };
  }

  async function checkConsent() {
    try {
      const response = await fetch(\`\${config.baseUrl}/api/v1/public/cookies/consent-status/\${config.websiteId}/\${userId}\`);
      const data = await response.json();
      
      if (data.status === 'WITHDRAWN' || data.status === 'NONE') {
        localStorage.removeItem('proteccio-consent');
        initBanner();
      } else {
        console.log('Proteccio: Valid consent found on server.');
      }
    } catch (e) {
      const localConsent = localStorage.getItem('proteccio-consent');
      if (!localConsent) initBanner();
    }
  }

  // Load Fonts
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);

  checkConsent();
})();
    `;
  }
}
