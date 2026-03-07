import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEscalationRuleDto } from './dto/create-escalation-rule.dto';
import { UpdateEscalationRuleDto } from './dto/update-escalation-rule.dto';
import { EscalationTrigger, ConfigRuleStatus } from '@prisma/client';

@Injectable()
export class EscalationRulesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEscalationRuleDto) {
    return this.prisma.escalationRule.create({
      data: dto as any,
    });
  }

  async findAll(filters: {
    triggerCondition?: EscalationTrigger;
    status?: ConfigRuleStatus;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.triggerCondition) where.triggerCondition = filters.triggerCondition;
    if (filters.status) where.status = filters.status;
    if (filters.tenantId) where.tenantId = filters.tenantId;

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.escalationRule.count({ where }),
      this.prisma.escalationRule.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  async findOne(id: string) {
    const rule = await this.prisma.escalationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Escalation rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateEscalationRuleDto) {
    await this.findOne(id);
    return this.prisma.escalationRule.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.escalationRule.delete({ where: { id } });
  }
}
