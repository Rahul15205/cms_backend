import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditCategory, AuditSeverity, SystemLogCategory } from '@prisma/client';
import { buildHumanLogDetails, sanitizeLogPayload } from '../utils/log-details.utils';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;

    // Skip GET requests to avoid log floods
    if (method === 'GET') {
      return next.handle();
    }

    let oldData = null;

    // --- CAPTURE BEFORE SNAPSHOT FOR MUTATIONS ---
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
       const entityMatch = url.match(/\/api\/v1\/([a-zA-Z0-9\/-]+)\/([a-zA-Z0-9-]+)$/);
       if (entityMatch && entityMatch[2]) {
           const entityStr = entityMatch[1];
           const entityId = entityMatch[2];
           
           let modelName = entityStr.split('/').pop()?.replace(/s$/, '') || null;
           
           if (entityStr.includes('config/workflows')) modelName = 'workflowConfig';
           else if (entityStr.includes('roles')) modelName = 'role';
           else if (entityStr.includes('users')) modelName = 'user';
           else if (entityStr.includes('rights')) modelName = 'rightsRequest';
           
           if (modelName && (this.prisma as any)[modelName]) {
              try {
                  oldData = await (this.prisma as any)[modelName].findUnique({ where: { id: entityId } });
              } catch (e) { /* ignore */ }
           }
       }
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const category = this.getCategory(url);
          let actionLabel = `${method} ${url}`;

          const safeBody = sanitizeLogPayload(body);
          const humanDetails = buildHumanLogDetails(method, url, safeBody, oldData);

          await this.prisma.auditLog.create({
            data: {
              userId: user?.userId || null,
              tenantId: user?.tenantId || null,
              action: actionLabel,
              category,
              severity: method === 'DELETE' ? AuditSeverity.WARNING : AuditSeverity.INFO,
              ipAddress: ip || '127.0.0.1',
              details: humanDetails || undefined,
            },
          });

          // Propagate to SystemLog for unified viewing
          try {
            let userName = 'System';
            if (user?.userId) {
              const u = await this.prisma.user.findUnique({ where: { id: user.userId } });
              if (u) {
                userName = u.name || user.email || 'System';
              }
            } else if (user?.email) {
              userName = user.email;
            } else if (body?.email) {
              userName = body.email;
            } else if (body?.identifier) {
              userName = body.identifier;
            } else if (body?.name) {
              userName = body.name;
            }

            // Extract humanised dynamic description of action
            const displayAction = this.humaniseAction(method, url, safeBody);

            const systemCategory = this.getSystemCategory(url);

            await this.prisma.systemLog.create({
              data: {
                category: systemCategory,
                action: displayAction,
                userName,
                target: this.describeTarget(url, method, safeBody, oldData),
                ipAddress: ip || '127.0.0.1',
                details: humanDetails || undefined,
                tenantId: user?.tenantId || null,
              },
            });
          } catch (systemErr) {
            console.error('AuditInterceptor failed to write SystemLog:', systemErr);
          }
        } catch (err) {
          // Fail silently in interceptor so endpoint still responds successfully
          console.error('AuditInterceptor Failed to submit log:', err);
        }
      }),
    );
  }

  private getCategory(url: string): AuditCategory {
    const path = url.toLowerCase();
    if (path.includes('/auth') || path.includes('/login')) return AuditCategory.SECURITY;
    if (path.includes('/users')) return AuditCategory.PROFILE;
    if (path.includes('/roles')) return AuditCategory.ROLE;
    if (path.includes('/sessions')) return AuditCategory.SESSION;
    if (path.includes('/config')) return AuditCategory.APPLICATION;
    if (path.includes('/tenant')) return AuditCategory.TENANT;
    if (path.includes('/workflow')) return AuditCategory.WORKFLOW;
    if (path.includes('/branding')) return AuditCategory.BRANDING;
    return AuditCategory.API;
  }

  private getSystemCategory(url: string): SystemLogCategory {
    const path = url.toLowerCase();
    if (
      path.includes('/consent-records') ||
      path.includes('/consent-widgets') ||
      path.includes('/public/consent') ||
      path.includes('/consent-templates') ||
      path.includes('/consent-deployments') ||
      path.includes('/consent-versions') ||
      path.includes('/public/cookies') ||
      path.includes('/cookies')
    ) {
      return 'LOG_CONSENT';
    }
    if (path.includes('/rights') || path.includes('/grievances') || path.includes('/sla-rules')) {
      return 'LOG_RIGHTS';
    }
    if (
      path.includes('/auth') ||
      path.includes('/security') ||
      path.includes('/sessions') ||
      path.includes('/users') ||
      path.includes('/roles') ||
      path.includes('/api-keys')
    ) {
      return 'LOG_SECURITY';
    }
    if (
      path.includes('/config') ||
      path.includes('/settings') ||
      path.includes('/languages') ||
      path.includes('/purposes') ||
      path.includes('/data-categories') ||
      path.includes('/third-parties') ||
      path.includes('/sub-processors') ||
      path.includes('/integrations')
    ) {
      return 'LOG_SYSTEM';
    }
    return 'LOG_AUDIT';
  }

  private humaniseAction(method: string, url: string, body?: any): string {
    const lowerUrl = url.toLowerCase();
    const status = body?.status?.toLowerCase?.() || '';

    // ── Authentication & Sessions ──────────────────────────
    if (lowerUrl.includes('/auth/login')) return 'User Login Successful';
    if (lowerUrl.includes('/auth/logout')) return 'User Logout';
    if (lowerUrl.includes('/auth/refresh')) return 'Refreshed Session Token';
    if (lowerUrl.includes('/auth/mfa/generate')) return 'Generated MFA Secret';
    if (lowerUrl.includes('/auth/mfa/enable')) return 'Enabled Multi-Factor Authentication (MFA)';

    // ── Public Widget Events (status-aware) ────────────────
    if (lowerUrl.includes('/public/consent/record')) {
      if (status === 'rejected' || status === 'revoked') return 'Consent Rejected (Public Widget)';
      return 'Consent Granted (Public Widget)';
    }
    if (lowerUrl.includes('/public/consent/withdraw')) return 'Consent Withdrawn (Public Widget)';
    if (lowerUrl.includes('/public/cookies/consent-logs') || lowerUrl.includes('/cookies/consent-logs')) {
      return 'Cookie Preferences Submitted';
    }

    // ── Consent Records (status-aware) ─────────────────────
    if (lowerUrl.includes('/consent-records')) {
      if (method === 'POST') {
        if (status === 'rejected') return 'Consent Rejected';
        if (status === 'revoked') return 'Consent Revoked';
        if (status === 'granted' || status === 'accepted') return 'Consent Granted';
        return 'New Consent Record Created';
      }
      if (method === 'PUT' || method === 'PATCH') {
        if (status === 'revoked') return 'Consent Revoked';
        if (status === 'rejected') return 'Consent Rejected';
        if (status === 'granted') return 'Consent Re-Granted';
        return 'Consent Record Updated';
      }
      return 'Consent Record Deleted';
    }

    // ── Consent Templates / Widgets / Deployments / Versions
    if (lowerUrl.includes('/consent-templates')) {
      return this.labelByMethod(method, 'Consent Template');
    }
    if (lowerUrl.includes('/consent-widgets')) {
      return this.labelByMethod(method, 'Consent Widget');
    }
    if (lowerUrl.includes('/consent-deployments')) {
      return this.labelByMethod(method, 'Consent Deployment');
    }
    if (lowerUrl.includes('/consent-versions')) {
      return this.labelByMethod(method, 'Consent Version');
    }
    if (lowerUrl.includes('/consent-analytics')) return 'Accessed Consent Analytics';

    // ── Cookie Management ──────────────────────────────────
    if (lowerUrl.includes('/cookies')) {
      return this.labelByMethod(method, 'Cookie Configuration');
    }

    // ── Rights & Grievances ────────────────────────────────
    if (lowerUrl.includes('/rights-requests') || lowerUrl.includes('/rights')) {
      return this.labelByMethod(method, 'Rights Request', 'Submitted');
    }
    if (lowerUrl.includes('/grievances')) {
      return this.labelByMethod(method, 'Grievance', 'Filed');
    }
    if (lowerUrl.includes('/sla-rules')) {
      return this.labelByMethod(method, 'SLA Rule');
    }
    if (lowerUrl.includes('/escalation-rules')) {
      return this.labelByMethod(method, 'Escalation Rule');
    }
    if (lowerUrl.includes('/notification-rules')) {
      return this.labelByMethod(method, 'Notification Rule');
    }

    // ── Users, Roles & Access ──────────────────────────────
    if (lowerUrl.includes('/users')) {
      if (method === 'POST') return 'Created User Account';
      if (method === 'PUT' || method === 'PATCH') return 'Updated User Profile';
      if (method === 'DELETE') return 'Deleted User Account';
    }
    if (lowerUrl.includes('/roles')) {
      return this.labelByMethod(method, 'Role');
    }
    if (lowerUrl.includes('/invitations')) {
      if (method === 'POST') return 'Sent Invitation';
      if (method === 'DELETE') return 'Revoked Invitation';
      return 'Updated Invitation';
    }
    if (lowerUrl.includes('/sessions')) {
      if (method === 'DELETE') return 'Session Terminated';
      return 'Session Updated';
    }
    if (lowerUrl.includes('/access-rules')) {
      return this.labelByMethod(method, 'Access Rule');
    }

    // ── Configuration & Settings ───────────────────────────
    if (lowerUrl.includes('/settings')) return 'Updated System Settings';
    if (lowerUrl.includes('/config/log-retention')) return 'Updated Log Retention Policy';
    if (lowerUrl.includes('/config/encryption')) return 'Updated Encryption Configuration';
    if (lowerUrl.includes('/config/export')) return 'Updated Export Preferences';
    if (lowerUrl.includes('/config/api-keys') || lowerUrl.includes('/api-keys')) {
      if (method === 'POST') return 'Created API Key';
      if (method === 'DELETE') return 'Revoked API Key';
      return 'Updated API Key';
    }
    if (lowerUrl.includes('/workflow')) {
      return this.labelByMethod(method, 'Workflow Configuration');
    }

    // ── Master Data ────────────────────────────────────────
    if (lowerUrl.includes('/purposes')) {
      return this.labelByMethod(method, 'Purpose');
    }
    if (lowerUrl.includes('/data-categories')) {
      return this.labelByMethod(method, 'Data Category');
    }
    if (lowerUrl.includes('/third-parties')) {
      if (method === 'POST') return 'Added Third Party';
      if (method === 'PUT' || method === 'PATCH') return 'Updated Third Party';
      if (method === 'DELETE') return 'Removed Third Party';
    }
    if (lowerUrl.includes('/sub-processors')) {
      if (method === 'POST') return 'Added Sub-Processor';
      if (method === 'PUT' || method === 'PATCH') return 'Updated Sub-Processor';
      if (method === 'DELETE') return 'Removed Sub-Processor';
    }
    if (lowerUrl.includes('/languages')) {
      if (method === 'POST') return 'Added Language';
      if (method === 'PUT' || method === 'PATCH') return 'Updated Language';
      if (method === 'DELETE') return 'Removed Language';
    }
    if (lowerUrl.includes('/integrations')) {
      if (method === 'POST') return 'Added Integration';
      if (method === 'PUT' || method === 'PATCH') return 'Updated Integration';
      if (method === 'DELETE') return 'Removed Integration';
    }
    if (lowerUrl.includes('/applications')) {
      if (method === 'POST') return 'Registered Application';
      if (method === 'PUT' || method === 'PATCH') return 'Updated Application';
      if (method === 'DELETE') return 'Removed Application';
    }
    if (lowerUrl.includes('/notices')) {
      return this.labelByMethod(method, 'Notice');
    }
    if (lowerUrl.includes('/export-configs')) {
      return this.labelByMethod(method, 'Export Configuration');
    }
    if (lowerUrl.includes('/reports')) {
      if (method === 'POST') return 'Generated Report';
      return 'Accessed Reports';
    }
    if (lowerUrl.includes('/aadhaar')) {
      return this.labelByMethod(method, 'Aadhaar Configuration');
    }

    // ── Fallback smart parser (improved ID detection) ──────
    const parts = url.split('?')[0].split('/').filter(p => {
      if (!p) return false;
      const pl = p.toLowerCase();
      if (pl === 'api' || pl === 'v1' || pl === 'public' || pl === 'config') return false;
      // Only filter segments that genuinely look like IDs:
      if (/^\d+$/.test(pl)) return false;                                  // Pure numbers
      if (/^[a-f0-9]{8,}$/.test(pl)) return false;                          // Hex IDs
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(pl)) return false; // UUIDs
      if (pl.length >= 8 && /\d/.test(pl) && /[_-]/.test(pl)) return false;  // Mixed alphanumeric IDs with separators
      if (/^[a-z]-[a-z0-9]{4,}$/i.test(p)) return false;                    // Short IDs like U-KMTVBO5
      return true;
    });

    const lastSegment = parts.pop();
    if (lastSegment) {
      const friendlyName = lastSegment
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/s$/, '');

      if (method === 'POST') return `Created ${friendlyName}`;
      if (method === 'PUT' || method === 'PATCH') return `Updated ${friendlyName}`;
      if (method === 'DELETE') return `Deleted ${friendlyName}`;
      return `${method} ${friendlyName}`;
    }

    return `${method} ${url}`;
  }

  /** Helper: generates a standard Created/Updated/Deleted label for a resource */
  private labelByMethod(method: string, resource: string, createVerb = 'Created'): string {
    if (method === 'POST') return `${createVerb} ${resource}`;
    if (method === 'PUT' || method === 'PATCH') return `Updated ${resource}`;
    if (method === 'DELETE') return `Deleted ${resource}`;
    return `${method} ${resource}`;
  }

  /** Builds a human-readable resource description for the "target" column */
  private describeTarget(url: string, method: string, body: any, oldData: any): string | null {
    const lowerUrl = url.toLowerCase();

    // Identify the entity from the old snapshot or body
    const entity = oldData || body || {};
    const name = entity.name || entity.title || entity.label || null;
    const email = entity.email || entity.endUserEmail || entity.requesterEmail || null;
    const status = entity.status || null;

    // ── Consent Records ──────────────────────────────────
    if (lowerUrl.includes('/consent-records') || lowerUrl.includes('/public/consent/record')) {
      const parts: string[] = [];
      if (email) parts.push(email);
      else if (entity.endUserPhone) parts.push(entity.endUserPhone);
      if (status) parts.push(status);
      return parts.length > 0 ? `Consent: ${parts.join(' · ')}` : 'Consent Record';
    }

    // ── Public consent withdraw ──────────────────────────
    if (lowerUrl.includes('/public/consent/withdraw')) {
      return entity.identifier ? `Withdraw: ${entity.identifier}` : 'Consent Withdrawal';
    }

    // ── Cookie consent ───────────────────────────────────
    if (lowerUrl.includes('/cookies/consent-logs') || lowerUrl.includes('/public/cookies')) {
      return email || 'Cookie Preferences';
    }

    // ── Consent Templates / Widgets / Deployments / Versions
    if (lowerUrl.includes('/consent-templates')) return name ? `Template: ${name}` : 'Consent Template';
    if (lowerUrl.includes('/consent-widgets')) return name ? `Widget: ${name}` : 'Consent Widget';
    if (lowerUrl.includes('/consent-deployments')) return name ? `Deployment: ${name}` : 'Consent Deployment';
    if (lowerUrl.includes('/consent-versions')) return name || 'Consent Version';

    // ── Users ────────────────────────────────────────────
    if (lowerUrl.includes('/users')) {
      if (name && email) return `${name} (${email})`;
      return name || email || 'User';
    }

    // ── Auth / Login ─────────────────────────────────────
    if (lowerUrl.includes('/auth')) {
      return email || body?.identifier || 'Auth Session';
    }

    // ── Roles ────────────────────────────────────────────
    if (lowerUrl.includes('/roles')) return name ? `Role: ${name}` : 'Role';

    // ── Sessions ─────────────────────────────────────────
    if (lowerUrl.includes('/sessions')) return email || 'Session';

    // ── Rights Requests ──────────────────────────────────
    if (lowerUrl.includes('/rights')) {
      const requester = entity.requesterName || entity.requesterEmail || null;
      const type = entity.requestType || null;
      if (requester && type) return `${type}: ${requester}`;
      return requester || type || 'Rights Request';
    }

    // ── Grievances ───────────────────────────────────────
    if (lowerUrl.includes('/grievances')) {
      return entity.subject || name || 'Grievance';
    }

    // ── API Keys ─────────────────────────────────────────
    if (lowerUrl.includes('/api-keys')) return name || 'API Key';

    // ── Applications ─────────────────────────────────────
    if (lowerUrl.includes('/applications')) return name || 'Application';

    // ── Invitations ──────────────────────────────────────
    if (lowerUrl.includes('/invitations')) return email || 'Invitation';

    // ── Purposes / Data Categories / Third Parties / Sub-Processors
    if (lowerUrl.includes('/purposes')) return name || 'Purpose';
    if (lowerUrl.includes('/data-categories')) return name || entity.category || 'Data Category';
    if (lowerUrl.includes('/third-parties')) return name || 'Third Party';
    if (lowerUrl.includes('/sub-processors')) return name || 'Sub-Processor';

    // ── SLA / Escalation / Notification Rules ────────────
    if (lowerUrl.includes('/sla-rules')) return name || 'SLA Rule';
    if (lowerUrl.includes('/escalation-rules')) return name || 'Escalation Rule';
    if (lowerUrl.includes('/notification-rules')) return name || 'Notification Rule';

    // ── Notices ──────────────────────────────────────────
    if (lowerUrl.includes('/notices')) return name || entity.noticeType || 'Notice';

    // ── Integrations ─────────────────────────────────────
    if (lowerUrl.includes('/integrations')) return name || 'Integration';

    // ── Cookies ──────────────────────────────────────────
    if (lowerUrl.includes('/cookies')) return name || entity.domain || 'Cookie';

    // ── Languages ────────────────────────────────────────
    if (lowerUrl.includes('/languages')) return name || entity.code || 'Language';

    // ── Workflow ─────────────────────────────────────────
    if (lowerUrl.includes('/workflow')) return name || 'Workflow Config';

    // ── Settings / Config ────────────────────────────────
    if (lowerUrl.includes('/settings') || lowerUrl.includes('/config')) return 'System Configuration';

    // ── Export / Reports ─────────────────────────────────
    if (lowerUrl.includes('/export-configs')) return name || 'Export Config';
    if (lowerUrl.includes('/reports')) return name || 'Report';

    // ── Access Rules ─────────────────────────────────────
    if (lowerUrl.includes('/access-rules')) return name || 'Access Rule';

    // ── Aadhaar ──────────────────────────────────────────
    if (lowerUrl.includes('/aadhaar')) return 'Aadhaar Config';

    // ── Fallback: try to extract any meaningful identifier
    return name || email || null;
  }
}
