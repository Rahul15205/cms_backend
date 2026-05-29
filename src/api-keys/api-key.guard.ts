import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'; // PHASE 6 CHANGE
import { ApiKeyService } from './api-key.service'; // PHASE 6 CHANGE

@Injectable() // PHASE 6 CHANGE
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {} // PHASE 6 CHANGE

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Read from header: X-API-Key (Express automatically lowercases headers)
    const rawKey = request.headers['x-api-key'];
    if (!rawKey) {
      throw new UnauthorizedException('API key missing');
    }

    // Read tenant from header: X-Tenant-ID (Express automatically lowercases headers)
    const tenantId = request.headers['x-tenant-id'];
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID missing');
    }

    // Validate key belongs to this tenant
    const resolvedTenantId = await this.apiKeyService.validateKey(rawKey as string);
    if (resolvedTenantId !== tenantId) {
      throw new UnauthorizedException('Invalid API key for tenant');
    }

    // Attach tenantId to request for downstream use
    request.tenantId = resolvedTenantId;
    return true;
  }
}
