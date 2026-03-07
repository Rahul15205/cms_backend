import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExportConfigDto } from './dto/create-export-config.dto';

@Injectable()
export class ExportConfigsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateExportConfigDto) {
    return this.prisma.exportConfig.create({
      data: dto as any,
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.exportConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const config = await this.prisma.exportConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Export config not found');
    return config;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.exportConfig.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.exportConfig.delete({ where: { id } });
  }

  async executeNow(id: string) {
    await this.findOne(id);
    return this.prisma.exportConfig.update({
      where: { id },
      data: {
        lastExecuted: new Date(),
      },
    });
  }
}
