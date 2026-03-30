import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';

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
}
