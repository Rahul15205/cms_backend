import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAadhaarConfigDto } from './dto/update-aadhaar-config.dto';

@Injectable()
export class AadhaarConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.aadhaarConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.aadhaarConfig.create({
        data: { tenantId } as any,
      });
    }

    return config;
  }

  async updateConfig(tenantId: string, dto: UpdateAadhaarConfigDto) {
    const existing = await this.prisma.aadhaarConfig.findUnique({
      where: { tenantId },
    });

    if (existing) {
      return this.prisma.aadhaarConfig.update({
        where: { tenantId },
        data: dto as any,
      });
    } else {
      return this.prisma.aadhaarConfig.create({
        data: { ...dto, tenantId } as any,
      });
    }
  }
}
