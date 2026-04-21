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
  async getBannerScript(@Param('websiteId') websiteId: string) {
    const banner = await this.cookiesManagementService.getPublicBanner(websiteId);
    
    if (!banner) {
      return `console.warn('Proteccio: No active banner found for website ${websiteId}');`;
    }

    // Inject settings into a self-executing script
    return `
(function() {
  const config = ${JSON.stringify(banner)};
  
  function initBanner() {
    if (document.getElementById('proteccio-cookie-banner')) return;
    
    const bannerDiv = document.createElement('div');
    bannerDiv.id = 'proteccio-cookie-banner';
    bannerDiv.style.position = 'fixed';
    bannerDiv.style.zIndex = '999999';
    bannerDiv.style.left = '0';
    bannerDiv.style.right = '0';
    bannerDiv.style.fontFamily = 'sans-serif';
    
    if (config.position === 'TOP') {
      bannerDiv.style.top = '0';
    } else {
      bannerDiv.style.bottom = '0';
    }

    const themeColor = config.themeColor || '#10b981';
    
    bannerDiv.innerHTML = \`
      <div style="background: white; border-top: 1px solid #e2e8f0; box-shadow: 0 -4px 12px rgba(0,0,0,0.1); padding: 20px; display: flex; flex-direction: column; gap: 15px;">
        <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
          <h4 style="margin: 0 0 8px 0; color: #1a202c; font-size: 18px;">\${config.heading || 'We value your privacy'}</h4>
          <p style="margin: 0 0 15px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">\${config.description || ''}</p>
          <div style="display: flex; gap: 10px;">
            <button id="proteccio-accept" style="background: \${themeColor}; color: white; border: none; padding: 8px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">Accept All</button>
            <button id="proteccio-reject" style="background: transparent; color: #4a5568; border: 1px solid #cbd5e0; padding: 8px 24px; border-radius: 6px; cursor: pointer;">Reject All</button>
          </div>
        </div>
      </div>
    \`;

    document.body.appendChild(bannerDiv);

    document.getElementById('proteccio-accept').onclick = () => {
      localStorage.setItem('proteccio-consent', 'accepted');
      bannerDiv.remove();
    };
    
    document.getElementById('proteccio-reject').onclick = () => {
      localStorage.setItem('proteccio-consent', 'rejected');
      bannerDiv.remove();
    };
  }

  if (localStorage.getItem('proteccio-consent')) return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
  } else {
    initBanner();
  }
})();
    `;
  }
}
