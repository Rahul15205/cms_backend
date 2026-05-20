import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditCategory, AuditSeverity, SystemLogCategory } from '@prisma/client';

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

          // Mask password fields in logs to prevent PII leaks
          const safeBody = { ...body };
          if (safeBody.password) safeBody.password = '********';
          if (safeBody.confirmPassword) safeBody.confirmPassword = '********';

          await this.prisma.auditLog.create({
            data: {
              userId: user?.userId || null,
              tenantId: user?.tenantId || null,
              action: actionLabel,
              category,
              severity: method === 'DELETE' ? AuditSeverity.WARNING : AuditSeverity.INFO,
              ipAddress: ip || '127.0.0.1',
              details: {
                requestBody: Object.keys(safeBody).length > 0 ? safeBody : undefined,
                beforeSnapshot: oldData || undefined,
                success: true,
              },
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
            const displayAction = this.humaniseAction(method, url);

            const systemCategory = this.getSystemCategory(url);

            await this.prisma.systemLog.create({
              data: {
                category: systemCategory,
                action: displayAction,
                userName,
                target: (oldData as any)?.id || body?.id || null,
                ipAddress: ip || '127.0.0.1',
                details: {
                  requestBody: Object.keys(safeBody).length > 0 ? safeBody : undefined,
                  success: true,
                },
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

  private humaniseAction(method: string, url: string): string {
    const lowerUrl = url.toLowerCase();

    // 1. Precise overrides for authentication and sessions
    if (lowerUrl.includes('/auth/login')) return 'User Login Successful';
    if (lowerUrl.includes('/auth/logout')) return 'User Logout';
    if (lowerUrl.includes('/auth/refresh')) return 'Refreshed Session Token';
    if (lowerUrl.includes('/auth/mfa/generate')) return 'Generated MFA Secret';
    if (lowerUrl.includes('/auth/mfa/enable')) return 'Enabled Multi-Factor Authentication (MFA)';

    // 2. Precise overrides for public widget events
    if (lowerUrl.includes('/public/consent/record')) return 'Consent Granted (Public Widget)';
    if (lowerUrl.includes('/public/consent/withdraw')) return 'Consent Withdrawn (Public Widget)';
    if (lowerUrl.includes('/public/cookies/consent-logs') || lowerUrl.includes('/cookies/consent-logs')) {
      return 'Cookie Preferences Submitted (Public Widget)';
    }

    // 3. Precise overrides for configuration / settings
    if (lowerUrl.includes('/settings')) return 'Updated System Settings';
    if (lowerUrl.includes('/config/log-retention')) return 'Updated Log Retention Policy';
    if (lowerUrl.includes('/config/encryption')) return 'Updated Encryption Configuration';
    if (lowerUrl.includes('/config/export')) return 'Updated Export Preferences';
    if (lowerUrl.includes('/config/api-keys')) {
      return method === 'DELETE' ? 'Revoked API Key' : 'Generated/Updated API Key';
    }

    // 4. Fallback smart parser that filters out IDs and splits path segments
    const parts = url.split('?')[0].split('/').filter(p => {
      if (!p) return false;
      const pl = p.toLowerCase();
      if (pl === 'api' || pl === 'v1' || pl === 'public' || pl === 'config') return false;
      // Detect if segment is an ID / UUID (contains numbers, hyphens, or underscores, length >= 8)
      if (pl.length >= 8 && (/\d/.test(pl) || pl.includes('-') || pl.includes('_'))) {
        return false;
      }
      return true;
    });

    const lastSegment = parts.pop();
    if (lastSegment) {
      // singularize and capitalize nicely
      const friendlyName = lastSegment
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/s$/, ''); // Remove trailing 's' to singularize (e.g. consent-records -> Consent Record)

      if (method === 'POST') return `Created new ${friendlyName}`;
      if (method === 'PUT' || method === 'PATCH') return `Updated ${friendlyName}`;
      if (method === 'DELETE') return `Deleted ${friendlyName}`;
      return `${method} ${friendlyName}`;
    }

    return `${method} ${url}`;
  }
}
