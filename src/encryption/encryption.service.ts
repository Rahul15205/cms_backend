import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEncryptionConfigDto } from './dto/update-encryption-config.dto';

@Injectable()
export class EncryptionService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId?: string) {
    const where = tenantId ? { tenantId } : { id: undefined }; // Without tenantId, just fetch the first one if we can't search by unique tenantId
    
    // Prisma requires a unique identifier. If tenantId isn't provided, 
    // fetch the first available config using findFirst instead of findUnique
    let config = tenantId 
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();

    if (!config) {
      // Initialize with defaults if not exists
      config = await this.prisma.encryptionConfig.create({
        data: tenantId ? { tenantId } as any : {},
      });
    }

    return config;
  }

  async updateConfig(tenantId: string | undefined, dto: UpdateEncryptionConfigDto) {
    const existing = tenantId
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();

    if (existing) {
      return this.prisma.encryptionConfig.update({
        where: { id: existing.id },
        data: dto as any,
      });
    } else {
      return this.prisma.encryptionConfig.create({
        data: tenantId ? { ...dto, tenantId } as any : { ...dto } as any,
      });
    }
  }

  async rotateKey(tenantId?: string) {
    const existing = tenantId
      ? await this.prisma.encryptionConfig.findUnique({ where: { tenantId } })
      : await this.prisma.encryptionConfig.findFirst();
      
    if (!existing) return null;

    return this.prisma.encryptionConfig.update({
      where: { id: existing.id },
      data: {
        lastRotation: new Date(),
      },
    });
  }
}
