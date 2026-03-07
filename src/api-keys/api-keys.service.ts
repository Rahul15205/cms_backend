import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateApiKeyDto) {
    const key = `pk_${crypto.randomBytes(24).toString('hex')}`;
    return this.prisma.apiKey.create({
      data: {
        ...dto,
        key,
      } as any,
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('API Key not found');
    return apiKey;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.apiKey.delete({ where: { id } });
  }
}
