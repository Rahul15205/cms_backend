import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';

@Injectable()
export class AccessRulesService {
  constructor(private prisma: PrismaService) {}

  create(createAccessRuleDto: CreateAccessRuleDto, tenantId: string) {
    return this.prisma.accessRule.create({
      data: {
        ...(createAccessRuleDto as any),
        tenantId
      }
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.accessRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.accessRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Access rule not found');
    return rule;
  }

  async update(id: string, updateAccessRuleDto: UpdateAccessRuleDto) {
    await this.findOne(id);
    return this.prisma.accessRule.update({
      where: { id },
      data: updateAccessRuleDto as any
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.accessRule.delete({ where: { id } });
  }
}
