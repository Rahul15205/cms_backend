import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAadhaarConfigDto } from './dto/update-aadhaar-config.dto';

@Injectable()
export class AadhaarConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId?: string) {
    let config = tenantId
      ? await this.prisma.aadhaarConfig.findUnique({ where: { tenantId } })
      : await this.prisma.aadhaarConfig.findFirst();

    if (!config) {
      config = await this.prisma.aadhaarConfig.create({
        data: tenantId ? { tenantId } as any : {},
      });
    }

    return config;
  }

  async updateConfig(tenantId: string | undefined, dto: UpdateAadhaarConfigDto) {
    const existing = tenantId
      ? await this.prisma.aadhaarConfig.findUnique({ where: { tenantId } })
      : await this.prisma.aadhaarConfig.findFirst();

    if (existing) {
      return this.prisma.aadhaarConfig.update({
        where: { id: existing.id },
        data: dto as any,
      });
    } else {
      return this.prisma.aadhaarConfig.create({
        data: tenantId ? { ...dto, tenantId } as any : { ...dto } as any,
      });
    }
  }
}
