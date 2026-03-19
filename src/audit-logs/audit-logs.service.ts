import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { 
    tenantId?: string; 
    userId?: string; 
    category?: AuditCategory;
    severity?: AuditSeverity;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
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

    const take = filters?.limit ? Number(filters.limit) : 50;
    const skip = filters?.offset ? Number(filters.offset) : 0;

    return this.prisma.auditLog.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
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
