import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogRetentionRuleDto } from './dto/create-log-retention-rule.dto';

@Injectable()
export class LogRetentionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateLogRetentionRuleDto) {
    return this.prisma.logRetentionRule.create({
      data: dto as any,
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.logRetentionRule.findMany({
      where,
      orderBy: { logType: 'asc' },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.logRetentionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Log retention rule not found');
    return rule;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.logRetentionRule.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.logRetentionRule.delete({ where: { id } });
  }
}
