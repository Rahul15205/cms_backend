import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaRuleDto } from './dto/create-sla-rule.dto';
import { UpdateSlaRuleDto } from './dto/update-sla-rule.dto';
import { SLAScope, SLARuleStatus, Regulation } from '@prisma/client';

@Injectable()
export class SlaRulesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSlaRuleDto) {
    return this.prisma.slaRule.create({
      data: dto as any,
    });
  }

  async findAll(filters: {
    scope?: SLAScope;
    regulation?: Regulation;
    status?: SLARuleStatus;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.scope) where.scope = filters.scope;
    if (filters.regulation) where.regulation = filters.regulation;
    if (filters.status) where.status = filters.status;
    if (filters.tenantId) where.tenantId = filters.tenantId;

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.slaRule.count({ where }),
      this.prisma.slaRule.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  async findOne(id: string) {
    const rule = await this.prisma.slaRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('SLA rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateSlaRuleDto) {
    await this.findOne(id);
    return this.prisma.slaRule.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.slaRule.delete({ where: { id } });
  }
}
