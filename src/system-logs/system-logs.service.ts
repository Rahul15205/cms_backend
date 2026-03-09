import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogCategory, Prisma } from '@prisma/client';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    category?: SystemLogCategory;
    search?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.SystemLogWhereInput = {};

    if (filters.category) where.category = filters.category;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { userName: { contains: filters.search, mode: 'insensitive' } },
        { target: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { data, total };
  }

  async exportLogs(filters: {
    category?: SystemLogCategory;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.SystemLogWhereInput = {};
    if (filters.category) where.category = filters.category;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const logs = await this.prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Export cap
    });

    return {
      data: logs,
      total: logs.length,
      exportedAt: new Date().toISOString(),
    };
  }
}
