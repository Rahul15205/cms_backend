import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEncryptionConfigDto } from './dto/update-encryption-config.dto';

@Injectable()
export class EncryptionService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    let config = await this.prisma.encryptionConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      // Initialize with defaults if not exists
      config = await this.prisma.encryptionConfig.create({
        data: { tenantId } as any,
      });
    }

    return config;
  }

  async updateConfig(tenantId: string, dto: UpdateEncryptionConfigDto) {
    // Upsert equivalent
    const existing = await this.prisma.encryptionConfig.findUnique({
      where: { tenantId },
    });

    if (existing) {
      return this.prisma.encryptionConfig.update({
        where: { tenantId },
        data: dto as any,
      });
    } else {
      return this.prisma.encryptionConfig.create({
        data: { ...dto, tenantId } as any,
      });
    }
  }

  async rotateKey(tenantId: string) {
    return this.prisma.encryptionConfig.update({
      where: { tenantId },
      data: {
        lastRotation: new Date(),
      },
    });
  }
}
