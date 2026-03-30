import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';
import { maskObjectPii } from '../common/utils/masking.utils';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { 
    tenantId?: string; 
    userId?: string; 
    category?: AuditCategory;
    severity?: AuditSeverity;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
    anonymize?: boolean;
  }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.category) where.category = filters.category;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const take = filters?.limit ? Number(filters.limit) : 10;
    const page = filters?.page ? Number(filters.page) : 1;
    const skip = (page - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } }
        }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    const returnedData = filters?.anonymize 
      ? data.map(log => ({
          ...log,
          user: log.user ? {
            ...log.user,
            email: log.user.email ? log.user.email.includes('@') ? log.user.email[0] + '***@' + log.user.email.split('@')[1] : log.user.email : undefined
          } : undefined,
          details: maskObjectPii(log.details)
        }))
      : data;

    return { data: returnedData, total };
  }

  async create(data: {
    userId?: string;
    action: string;
    category: AuditCategory;
    details?: any;
    ipAddress?: string;
    severity?: AuditSeverity;
    tenantId?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
