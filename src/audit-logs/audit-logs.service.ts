import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory, AuditSeverity, SystemLogCategory } from '@prisma/client';
import { maskObjectPii } from '../common/utils/masking.utils';
import { normalizeLogDetailsForDisplay } from '../common/utils/log-details.utils';

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

    const returnedData = data.map((log) => {
      const normalized = {
        ...log,
        details: normalizeLogDetailsForDisplay(log.details) || null,
      };
      if (!filters?.anonymize) return normalized;
      return {
        ...normalized,
        user: log.user
          ? {
              ...log.user,
              email: log.user.email?.includes('@')
                ? log.user.email[0] + '***@' + log.user.email.split('@')[1]
                : log.user.email,
            }
          : undefined,
        details: typeof normalized.details === 'string'
          ? normalized.details
          : maskObjectPii(normalized.details),
      };
    });

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
    const auditLog = await this.prisma.auditLog.create({ data });

    // Propagate security/session logs to the Unified SystemLog table
    try {
      let userName = 'System';
      if (data.userId) {
        const u = await this.prisma.user.findUnique({ where: { id: data.userId } });
        if (u) {
          userName = u.name || 'System';
        }
      }

      let systemCategory: SystemLogCategory = 'LOG_AUDIT';
      if (data.category === 'SECURITY' || data.category === 'SESSION' || data.category === 'PROFILE' || data.category === 'ROLE') {
        systemCategory = 'LOG_SECURITY';
      } else if (data.category === 'WORKFLOW' || data.category === 'APPLICATION' || data.category === 'BRANDING' || data.category === 'TENANT') {
        systemCategory = 'LOG_SYSTEM';
      } else if (data.category === 'API') {
        systemCategory = 'LOG_SYSTEM';
      }

      await this.prisma.systemLog.create({
        data: {
          category: systemCategory,
          action: data.action,
          userName,
          target: data.userId || null,
          ipAddress: data.ipAddress || '127.0.0.1',
          details: data.details || null,
          tenantId: data.tenantId || null,
        },
      });
    } catch (err) {
      console.error('Failed to create SystemLog from AuditLog:', err);
    }

    return auditLog;
  }
}
