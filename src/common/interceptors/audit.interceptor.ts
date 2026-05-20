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

            // Extract beautiful entity name and generate dynamic human-readable action label
            let displayAction = actionLabel;
            const entityMatch = url.match(/\/api\/v1\/([a-zA-Z0-9\/-]+)(\/([a-zA-Z0-9-]+))?$/);
            if (entityMatch) {
              const resource = entityMatch[1].split('/').pop()?.replace(/s$/, '');
              if (resource) {
                const resourceLabel = resource.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                if (method === 'POST') {
                  displayAction = `Created new ${resourceLabel}`;
                } else if (method === 'PUT' || method === 'PATCH') {
                  displayAction = `Updated ${resourceLabel}`;
                } else if (method === 'DELETE') {
                  displayAction = `Deleted ${resourceLabel}`;
                }
              }
            }

            // Specialized descriptive overrides for common pathways
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('/public/consent/record')) {
              displayAction = `Consent Granted (Public Widget)`;
            } else if (lowerUrl.includes('/public/consent/withdraw')) {
              displayAction = `Consent Withdrawn (Public Widget)`;
            } else if (lowerUrl.includes('/public/cookies/consent-logs')) {
              displayAction = `Cookie Preferences Submitted (Public Widget)`;
            }

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
}
