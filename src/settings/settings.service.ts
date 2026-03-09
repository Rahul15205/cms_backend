import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get tenant settings.
   */
  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  /**
   * Update tenant settings (merges with existing settings JSON).
   */
  async updateSettings(tenantId: string, updates: { name?: string; domain?: string; settings?: Record<string, any> }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.domain) data.domain = updates.domain;
    if (updates.settings) {
      // Merge with existing settings
      const existingSettings = (tenant.settings as Record<string, any>) ?? {};
      data.settings = { ...existingSettings, ...updates.settings };
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
