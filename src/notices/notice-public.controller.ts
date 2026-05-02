import { Controller, Get, Post, Body, Param, Header, Request, NotFoundException } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/public/notices')
export class NoticePublicController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('website/:websiteId')
  async getNoticesByWebsite(@Param('websiteId') websiteId: string) {
    return this.noticesService.getPublicNotices(websiteId);
  }

  @Get('type/:typeName')
  async getNoticeByType(
    @Param('typeName') typeName: string,
    @Request() req
  ) {
    const websiteId = req.query.websiteId;
    const lang = req.query.lang;
    if (!websiteId) throw new NotFoundException('websiteId query parameter is required');
    return this.noticesService.getPublicNoticeByType(websiteId as string, typeName, lang as string);
  }

  @Post('acknowledge/:noticeId')
  async acknowledgeNotice(@Param('noticeId') noticeId: string, @Body() dto: any, @Request() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return this.noticesService.recordNoticeAcknowledgement(noticeId, { ...dto, ipAddress });
  }

  @Get('script/:websiteId')
  @Header('Content-Type', 'application/javascript')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getNoticeScript(@Param('websiteId') websiteId: string, @Request() req) {
    const notices = await this.noticesService.getPublicNotices(websiteId);
    const host = req.get('host');
    const baseUrl = `//${host}`;

    return `
(function() {
  const config = {
    websiteId: '${websiteId}',
    baseUrl: '${baseUrl}',
    notices: ${JSON.stringify(notices)}
  };

  const ProteccioNotice = {
    renderModal: function(notice) {
      if (document.getElementById('proteccio-notice-container')) return;
      
      const container = document.createElement('div');
      container.id = 'proteccio-notice-container';
      
      // Styling for the Footer Bar
      container.style.cssText = \`
        position: fixed; 
        bottom: 20px; 
        left: 20px; 
        right: 20px; 
        z-index: 999999; 
        background: #ffffff; 
        color: #111827;
        padding: 16px 24px; 
        border-radius: 12px; 
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Inter', -apple-system, sans-serif;
        border: 1px solid rgba(0,0,0,0.05);
        animation: proteccio-slide-up 0.4s ease-out;
        max-width: 800px;
        margin: 0 auto;
      \`;
      
      container.innerHTML = \`
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: #10b98115; padding: 8px; border-radius: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 14px;">\${notice.title} Update</div>
            <div style="font-size: 12px; opacity: 0.7;">Please review our updated policy.</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="proteccio-view-notice" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;">Read Now</button>
          <button id="proteccio-close-notice" style="background: transparent; border: none; cursor: pointer; padding: 4px; color: #6b7280;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <style>
          @keyframes proteccio-slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      \`;

      document.body.appendChild(container);
      this.startTime = new Date().getTime();

      document.getElementById('proteccio-close-notice').onclick = () => container.remove();
      document.getElementById('proteccio-view-notice').onclick = () => {
        this.acknowledge(notice.id);
        container.remove();
        if (notice.contentUrl) window.open(notice.contentUrl, '_blank');
      };
    },

    showByType: function(typeName) {
      const notice = config.notices.find(n => 
        (n.type && (n.type.name === typeName || n.type.id === typeName)) || 
        (n.title === typeName)
      );
      if (notice) this.renderModal(notice);
    },

    acknowledge: function(noticeId) {
      const viewDuration = Math.round((new Date().getTime() - (this.startTime || new Date().getTime())) / 1000);
      fetch(\`\${config.baseUrl}/api/v1/public/notices/acknowledge/\${noticeId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: config.websiteId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewDuration: viewDuration,
          userId: localStorage.getItem('proteccio_user_id') || localStorage.getItem('userId')
        })
      }).then(() => {
        localStorage.setItem('proteccio_ack_' + noticeId, new Date().getTime());
      }).catch(err => console.error('Proteccio: Failed to record acknowledgement', err));
    },

    initAutoShow: function() {
      // Find all notices that haven't been acknowledged
      const pendingNotices = config.notices.filter(n => !localStorage.getItem('proteccio_ack_' + n.id));
      
      if (pendingNotices.length > 0) {
        let index = 0;
        const showNext = () => {
          if (index < pendingNotices.length) {
            const notice = pendingNotices[index];
            this.renderModal(notice);
            
            // Override the close and ack behavior to show the next one
            const originalClose = document.getElementById('proteccio-close-notice').onclick;
            const originalAck = document.getElementById('proteccio-view-notice').onclick;
            
            const handleNext = () => {
              index++;
              if (index < pendingNotices.length) {
                setTimeout(showNext, 500); // Small delay between modals
              }
            };

            document.getElementById('proteccio-close-notice').onclick = () => {
              originalClose();
              handleNext();
            };
            document.getElementById('proteccio-view-notice').onclick = () => {
              originalAck();
              handleNext();
            };
          }
        };

        setTimeout(showNext, 1500);
      }
    }
  };

  window.ProteccioNotice = ProteccioNotice;
  
  // Auto-show disabled as per user request to stop popups
  /*
  if (document.readyState === 'complete') {
    ProteccioNotice.initAutoShow();
  } else {
    window.addEventListener('load', () => ProteccioNotice.initAutoShow());
  }
  */
})();
    `;
  }
}
