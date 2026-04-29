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
      if (document.getElementById('proteccio-notice-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'proteccio-notice-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999999;font-family:sans-serif;';
      
      modal.innerHTML = \`
        <div style="background:white;width:90%;max-width:700px;max-height:85vh;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);animation: proteccioSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="padding:20px 24px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center;background:#fff;">
            <h2 style="margin:0;font-size:1.25rem;font-weight:700;color:#111827;">\${notice.title}</h2>
            <button id="proteccio-notice-close" style="background:#f3f4f6;border:none;width:32px;height:32px;border-radius:50%;font-size:1.25rem;cursor:pointer;color:#6b7280;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">&times;</button>
          </div>
          <div style="padding:24px;overflow-y:auto;flex:1;line-height:1.6;color:#374151;font-size:1rem;background:#fff;">
            \${notice.content || 'No content available.'}
          </div>
          <div style="padding:16px 24px;background:#f9fafb;display:flex;justify-content:flex-end;gap:12px;border-top:1px solid #f3f4f6;">
            <button id="proteccio-notice-ack" style="background:#10b981;color:white;border:none;padding:12px 28px;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 6px -1px rgba(16, 185, 129, 0.2);">I Acknowledge</button>
          </div>
        </div>
        <style>
          @keyframes proteccioSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          #proteccio-notice-close:hover { background: #e5e7eb; color: #111827; }
          #proteccio-notice-ack:hover { background: #059669; transform: translateY(-1px); }
        </style>
      \`;

      document.body.appendChild(modal);

      document.getElementById('proteccio-notice-close').onclick = () => modal.remove();
      document.getElementById('proteccio-notice-ack').onclick = () => {
        this.acknowledge(notice.id);
        modal.remove();
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
      fetch(\`\${config.baseUrl}/api/v1/public/notices/acknowledge/\${noticeId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: config.websiteId,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).then(() => {
        localStorage.setItem('proteccio_ack_' + noticeId, new Date().getTime());
      }).catch(err => console.error('Proteccio: Failed to record acknowledgement', err));
    },

    initAutoShow: function() {
      // Find the first notice that hasn't been acknowledged
      const pendingNotice = config.notices.find(n => !localStorage.getItem('proteccio_ack_' + n.id));
      if (pendingNotice) {
        setTimeout(() => {
          this.renderModal(pendingNotice);
        }, 1500);
      }
    }
  };

  window.ProteccioNotice = ProteccioNotice;
  
  if (document.readyState === 'complete') {
    ProteccioNotice.initAutoShow();
  } else {
    window.addEventListener('load', () => ProteccioNotice.initAutoShow());
  }
})();
    `;
  }
}
