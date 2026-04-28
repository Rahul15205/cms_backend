import { Controller, Get, Post, Body, Param, Header, Request, NotFoundException } from '@nestjs/common';
import { NoticesService } from './notices.service';

@Controller('api/v1/public/notices')
export class NoticePublicController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get('website/:websiteId')
  async getNoticesByWebsite(@Param('websiteId') websiteId: string) {
    return this.noticesService.getPublicNotices(websiteId);
  }

  @Post('acknowledge/:noticeId')
  async acknowledgeNotice(@Param('noticeId') noticeId: string, @Body() dto: any) {
    return this.noticesService.recordNoticeAcknowledgement(noticeId, dto);
  }

  @Get('script/:websiteId')
  @Header('Content-Type', 'application/javascript')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getNoticeScript(@Param('websiteId') websiteId: string, @Request() req) {
    const notices = await this.noticesService.getPublicNotices(websiteId);
    const host = req.get('host');
    const baseUrl = `${req.protocol}://${host}`;

    return `
(function() {
  const config = {
    websiteId: '${websiteId}',
    baseUrl: '${baseUrl}',
    notices: ${JSON.stringify(notices)}
  };

  const ProteccioNotice = {
    config: config,
    
    show: function(noticeId) {
      const notice = config.notices.find(n => n.id === noticeId);
      if (notice) {
        this.renderModal(notice);
      } else {
        console.warn('Proteccio: Notice not found with ID:', noticeId);
      }
    },

    showByType: function(typeName) {
      console.log('Proteccio: Looking for notice type:', typeName);
      const notice = config.notices.find(n => n.type && (n.type.name === typeName || n.type.id === typeName));
      if (notice) {
        this.renderModal(notice);
      } else {
        console.warn('Proteccio: No active notice found for type:', typeName);
        console.log('Proteccio: Available types:', config.notices.map(n => n.type?.name).filter(Boolean));
      }
    },

    renderModal: function(notice) {
      if (document.getElementById('proteccio-notice-modal')) {
        document.getElementById('proteccio-notice-modal').remove();
      }

      const modal = document.createElement('div');
      modal.id = 'proteccio-notice-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;';
      
      modal.innerHTML = \`
        <div style="background:white;width:90%;max-width:800px;max-height:80vh;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);animation: proteccio-fade-in 0.3s ease-out;">
          <div style="padding:20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
            <h2 style="margin:0;font-size:1.25rem;font-weight:600;color:#111;">\${notice.title}</h2>
            <button id="proteccio-notice-close" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#666;">&times;</button>
          </div>
          <div style="padding:24px;overflow-y:auto;flex:1;line-height:1.6;color:#374151;font-size:1rem;">
            \${notice.content || 'No content available.'}
          </div>
          <div style="padding:16px 20px;background:#f9fafb;display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #eee;">
            <button id="proteccio-notice-ack" style="background:#10b981;color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s;">I Acknowledge</button>
          </div>
        </div>
        <style>
          @keyframes proteccio-fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          #proteccio-notice-ack:hover { background: #059669; }
        </style>
      \`;

      document.body.appendChild(modal);

      document.getElementById('proteccio-notice-close').onclick = () => modal.remove();
      document.getElementById('proteccio-notice-ack').onclick = () => {
        this.acknowledge(notice.id);
        modal.remove();
      };
    },

    acknowledge: function(noticeId) {
      fetch(\`\${config.baseUrl}/api/v1/public/notices/acknowledge/\${noticeId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: config.websiteId,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).catch(err => console.error('Proteccio: Failed to record acknowledgement', err));
    }
  };

  window.ProteccioNotice = ProteccioNotice;

  // Add floating button if configured (optional)
  function initWidget() {
    const btn = document.createElement('div');
    btn.innerHTML = 'Privacy Notices';
    btn.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#111827;color:white;padding:10px 15px;border-radius:30px;font-size:12px;font-weight:600;cursor:pointer;z-index:999999;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
    btn.onclick = () => {
       if (config.notices.length === 1) {
         ProteccioNotice.show(config.notices[0].id);
       } else {
         // Show list if multiple
         alert('Select a notice to view:\\n' + config.notices.map(n => n.title).join('\\n'));
       }
    };
    // document.body.appendChild(btn);
  }

  // Auto-init
  // initWidget();
})();
    `;
  }
}
