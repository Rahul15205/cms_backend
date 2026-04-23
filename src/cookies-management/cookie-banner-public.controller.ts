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
  async recordConsent(@Param('websiteId') websiteId: string, @Body() dto: any) {
    return this.cookiesManagementService.recordPublicConsent(websiteId, dto);
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

    // Inject settings into a self-executing script
    return `
(function() {
  const config = ${JSON.stringify(banner)};
  config.websiteId = '${websiteId}';
  config.baseUrl = '${baseUrl}';
  const categories = ${JSON.stringify(categories)};
  
  function initBanner() {
    if (document.getElementById('proteccio-cookie-banner')) return;
    
    const bannerDiv = document.createElement('div');
    bannerDiv.id = 'proteccio-cookie-banner';
    
    // Advanced Styles from config
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
        display: flex; 
        flex-direction: column; 
        gap: 15px;
        width: 90%;
        max-width: \${maxWidth};
        border-radius: \${borderRadius};
        margin: \${config.position === 'BOTTOM' || config.position === 'TOP' ? '20px' : '0'};
        pointer-events: auto;
      ">
        <div style="display: flex; flex-direction: column; md-flex-direction: row; gap: 20px; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0; color: \${textColor}; font-size: \${parseInt(fontSize) + 4}px; font-weight: 700;">\${config.heading || 'We value your privacy'}</h4>
            <p style="margin: 0; color: \${textColor}; opacity: 0.8; font-size: \${fontSize}; line-height: 1.6;">\${config.description || 'We use cookies to improve your experience and analyze our traffic.'}</p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;">
            <button id="proteccio-preferences" style="background: transparent; color: \${textColor}; border: 1px solid \${textColor}33; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">Preferences</button>
            <button id="proteccio-reject" style="background: \${textColor}11; color: \${textColor}; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">Reject All</button>
            <button id="proteccio-accept" style="background: \${themeColor}; color: \${btnTextColor}; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.2s;">Accept All</button>
          </div>
        </div>
        <div style="padding-top: 10px; border-top: 1px solid \${textColor}11; display: flex; justify-content: space-between; align-items: center; opacity: 0.5; font-size: 10px; font-weight: 600; letter-spacing: 0.05em;">
          <span>GDPR & DPDP COMPLIANT</span>
          <span>PROTECCIO DATA</span>
        </div>
      </div>
    \`;

    const preferencesView = \`
      <div id="proteccio-preferences-view" style="
        display: none; 
        background: \${bgColor}; 
        color: \${textColor};
        border: 1px solid rgba(0,0,0,0.05); 
        box-shadow: 0 -10px 30px rgba(0,0,0,0.15); 
        padding: 30px; 
        max-height: 80vh; 
        overflow-y: auto;
        width: 100%;
        max-width: 800px;
        border-radius: \${borderRadius};
        pointer-events: auto;
      ">
        <div style="max-width: 800px; margin: 0 auto; width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="margin: 0; color: \${textColor}; font-size: 22px; font-weight: 800;">Preference Center</h3>
            <button id="proteccio-back" style="background: none; border: none; color: \${textColor}; opacity: 0.6; cursor: pointer; font-size: 14px; text-decoration: underline;">Back</button>
          </div>
          
          <div id="proteccio-category-list" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
            \${categories.map(cat => \`
              <div style="border: 1px solid \${textColor}11; border-radius: 12px; padding: 16px; background: \${textColor}05;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <span style="font-weight: 700; color: \${textColor}; font-size: 16px;">\${cat.name}</span>
                    \${cat.locked ? '<span style="margin-left: 8px; font-size: 11px; background: \${themeColor}; color: \${btnTextColor}; padding: 2px 8px; border-radius: 99px;">Essential</span>' : ''}
                  </div>
                  <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: \${cat.locked ? 'not-allowed' : 'pointer'};">
                    <input type="checkbox" class="proteccio-toggle" data-cat-id="\${cat.id}" \${cat.locked || cat.enabled ? 'checked' : ''} \${cat.locked ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: \${cat.locked ? themeColor : '#ccc'}; transition: .4s; border-radius: 34px; \${cat.locked ? 'opacity: 0.7;' : ''}"></span>
                    <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; transform: translateX(20px);"></span>
                  </label>
                </div>
                <p style="margin: 0 0 12px 0; color: \${textColor}; opacity: 0.7; font-size: 13px; line-height: 1.5;">\${cat.description || 'These cookies are necessary for the website to function.'}</p>
                
                \${cat.cookies && cat.cookies.length > 0 ? \`
                  <details style="margin-top: 10px; border-top: 1px solid \${textColor}11; padding-top: 10px;">
                    <summary style="font-size: 12px; color: \${themeColor}; cursor: pointer; font-weight: 500;">View Cookies (\${cat.cookies.length})</summary>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px;">
                      <thead>
                        <tr style="border-bottom: 1px solid \${textColor}11; text-align: left; color: \${textColor}; opacity: 0.5;">
                          <th style="padding: 6px 0;">Name</th>
                          <th style="padding: 6px 0;">Domain</th>
                          <th style="padding: 6px 0;">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${cat.cookies.map(cookie => \`
                          <tr style="border-bottom: 1px solid \${textColor}05;">
                            <td style="padding: 6px 0; color: \${textColor}; opacity: 0.8; font-family: monospace;">\${cookie.name}</td>
                            <td style="padding: 6px 0; color: \${textColor}; opacity: 0.6;">\${cookie.domain}</td>
                            <td style="padding: 6px 0; color: \${textColor}; opacity: 0.6;">\${cookie.expiration || 'Session'}</td>
                          </tr>
                        \`).join('')}
                      </tbody>
                    </table>
                  </details>
                \` : ''}
              </div>
            \`).join('')}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="proteccio-save-prefs" style="background: \${themeColor}; color: \${btnTextColor}; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px -2px \${themeColor}44;">Save My Preferences</button>
          </div>
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
        categories: activeCategories
      };
      localStorage.setItem('proteccio-consent', JSON.stringify(consentData));

      // GTM & DataLayer Integration
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'proteccio_consent_update',
        consent_status: status,
        consent_categories: activeCategories,
        // Google Consent Mode Mapping
        ad_storage: activeCategories.includes('ADVERTISING') ? 'granted' : 'denied',
        analytics_storage: activeCategories.includes('ANALYTICS') ? 'granted' : 'denied',
        functionality_storage: activeCategories.includes('FUNCTIONAL') ? 'granted' : 'denied',
        personalization_storage: activeCategories.includes('FUNCTIONAL') ? 'granted' : 'denied',
        security_storage: 'granted' // Necessary is always granted
      });

      bannerDiv.style.opacity = '0';
      bannerDiv.style.transform = 'translateY(20px)';
      
      // Save to server
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
      setConsent('partial', activeCats);
    };
  }

  if (localStorage.getItem('proteccio-consent')) return;
  
  // Load Inter Font
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
  } else {
    initBanner();
  }
})();
    `;
  }
}
