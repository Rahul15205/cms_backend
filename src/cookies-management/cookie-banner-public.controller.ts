import { Controller, Get, Param, Header } from '@nestjs/common';
import { CookiesManagementService } from './cookies-management.service';

@Controller('api/v1/public/cookies')
export class CookieBannerPublicController {
  constructor(private readonly cookiesManagementService: CookiesManagementService) {}

  @Get('banner/:websiteId')
  async getBanner(@Param('websiteId') websiteId: string) {
    return this.cookiesManagementService.getPublicBanner(websiteId);
  }

  @Get('banner-script/:websiteId')
  @Header('Content-Type', 'application/javascript')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getBannerScript(@Param('websiteId') websiteId: string) {
    const banner = await this.cookiesManagementService.getPublicBanner(websiteId);
    
    if (!banner) {
      return `console.warn('Proteccio: No active banner found for website ${websiteId}');`;
    }

    // Extract categories from nested tenant object
    const categories = (banner as any).tenant?.cookieCategories || [];

    // Inject settings into a self-executing script
    return `
(function() {
  const config = ${JSON.stringify(banner)};
  const categories = ${JSON.stringify(categories)};
  
  function initBanner() {
    if (document.getElementById('proteccio-cookie-banner')) return;
    
    const bannerDiv = document.createElement('div');
    bannerDiv.id = 'proteccio-cookie-banner';
    bannerDiv.style.cssText = 'position: fixed; z-index: 999999; left: 0; right: 0; font-family: "Inter", sans-serif; transition: all 0.3s ease;';
    
    if (config.position === 'TOP') {
      bannerDiv.style.top = '0';
    } else {
      bannerDiv.style.bottom = '0';
    }

    const themeColor = config.themeColor || '#10b981';
    
    const mainView = \`
      <div id="proteccio-main-view" style="background: white; border-top: 1px solid #e2e8f0; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); padding: 24px; display: flex; flex-direction: column; gap: 15px;">
        <div style="max-width: 1200px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; md-flex-direction: row; gap: 20px; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 700;">\${config.heading || 'We value your privacy'}</h4>
            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">\${config.description || 'We use cookies to improve your experience and analyze our traffic.'}</p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;">
            <button id="proteccio-preferences" style="background: white; color: #374151; border: 1px solid #d1d5db; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">Cookie Preferences</button>
            <button id="proteccio-reject" style="background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">Reject All</button>
            <button id="proteccio-accept" style="background: \${themeColor}; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.2s;">Accept All</button>
          </div>
        </div>
      </div>
    \`;

    const preferencesView = \`
      <div id="proteccio-preferences-view" style="display: none; background: white; border-top: 1px solid #e2e8f0; box-shadow: 0 -10px 30px rgba(0,0,0,0.15); padding: 30px; max-height: 80vh; overflow-y: auto;">
        <div style="max-width: 800px; margin: 0 auto; width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="margin: 0; color: #111827; font-size: 22px; font-weight: 800;">Preference Center</h3>
            <button id="proteccio-back" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; text-decoration: underline;">Back to banner</button>
          </div>
          
          <div id="proteccio-category-list" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 30px;">
            \${categories.map(cat => \`
              <div style="border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; background: #f9fafb;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <span style="font-weight: 700; color: #111827; font-size: 16px;">\${cat.name}</span>
                    \${cat.locked ? '<span style="margin-left: 8px; font-size: 11px; background: #e5e7eb; color: #4b5563; padding: 2px 8px; border-radius: 99px;">Essential</span>' : ''}
                  </div>
                  <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: \${cat.locked ? 'not-allowed' : 'pointer'};">
                    <input type="checkbox" class="proteccio-toggle" data-cat-id="\${cat.id}" \${cat.locked || cat.enabled ? 'checked' : ''} \${cat.locked ? 'disabled' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: \${cat.locked ? themeColor : '#ccc'}; transition: .4s; border-radius: 34px; \${cat.locked ? 'opacity: 0.7;' : ''}"></span>
                    <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; transform: translateX(20px);"></span>
                  </label>
                </div>
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">\${cat.description || 'These cookies are necessary for the website to function.'}</p>
                
                \${cat.cookies && cat.cookies.length > 0 ? \`
                  <details style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                    <summary style="font-size: 12px; color: \${themeColor}; cursor: pointer; font-weight: 500;">View Cookies (\${cat.cookies.length})</summary>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px;">
                      <thead>
                        <tr style="border-bottom: 1px solid #f3f4f6; text-align: left; color: #9ca3af;">
                          <th style="padding: 6px 0;">Name</th>
                          <th style="padding: 6px 0;">Domain</th>
                          <th style="padding: 6px 0;">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${cat.cookies.map(cookie => \`
                          <tr style="border-bottom: 1px solid #f9fafb;">
                            <td style="padding: 6px 0; color: #4b5563; font-family: monospace;">\${cookie.name}</td>
                            <td style="padding: 6px 0; color: #6b7280;">\${cookie.domain}</td>
                            <td style="padding: 6px 0; color: #6b7280;">\${cookie.expiration || 'Session'}</td>
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
            <button id="proteccio-save-prefs" style="background: \${themeColor}; color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px -2px \${themeColor}44;">Save My Preferences</button>
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
      document.getElementById('proteccio-main-view').style.display = 'block';
      document.getElementById('proteccio-preferences-view').style.display = 'none';
    };

    // Actions
    const setConsent = (status, selectedCats = null) => {
      const consentData = {
        status,
        timestamp: new Date().toISOString(),
        categories: selectedCats || categories.filter(c => c.locked || c.enabled).map(c => c.name)
      };
      localStorage.setItem('proteccio-consent', JSON.stringify(consentData));
      bannerDiv.style.opacity = '0';
      bannerDiv.style.transform = 'translateY(20px)';
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
