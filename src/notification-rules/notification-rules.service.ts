import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { NotificationChannel, ConfigRuleStatus } from '@prisma/client';

@Injectable()
export class NotificationRulesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateNotificationRuleDto) {
    return this.prisma.notificationRule.create({
      data: dto as any,
    });
  }

  async findAll(filters: {
    channel?: NotificationChannel;
    status?: ConfigRuleStatus;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.channel) where.channel = filters.channel;
    if (filters.status) where.status = filters.status;
    if (filters.tenantId) where.tenantId = filters.tenantId;

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.notificationRule.count({ where }),
      this.prisma.notificationRule.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const rule = await this.prisma.notificationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Notification rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateNotificationRuleDto) {
    await this.findOne(id);
    return this.prisma.notificationRule.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.notificationRule.delete({ where: { id } });
  }
}
