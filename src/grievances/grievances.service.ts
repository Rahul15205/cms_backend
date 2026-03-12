import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceDto } from './dto/update-grievance.dto';
import { CreateGrievanceCommentDto } from './dto/create-grievance-comment.dto';
import { GrievanceStatus } from '@prisma/client';

@Injectable()
export class GrievancesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGrievanceDto) {
    const { tenantId, ...rest } = dto;

    // Generate case number: GRV-{YEAR}-{PADDED_SEQ}
    const year = new Date().getFullYear();
    const count = await this.prisma.grievance.count({
      where: { caseNumber: { startsWith: `GRV-${year}-` } },
    });
    const caseNumber = `GRV-${year}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.grievance.create({
      data: { ...rest, caseNumber, tenantId },
    });
  }

  async findAll(filters: {
    status?: GrievanceStatus;
    category?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { userName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.grievance.count({ where }),
      this.prisma.grievance.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true } } },
      }),
    ]);

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
  }

  async findOne(id: string) {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: 'desc' } },
        _count: { select: { comments: true } },
      },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async update(id: string, dto: UpdateGrievanceDto) {
    await this.findOne(id);
    return this.prisma.grievance.update({ where: { id }, data: dto });
  }

  async addComment(id: string, dto: CreateGrievanceCommentDto, userId: string) {
    const grievance = await this.findOne(id);

    const comment = await this.prisma.grievanceComment.create({
      data: {
        grievanceId: id,
        content: dto.content,
        createdBy: userId,
      },
    });

    // Update lastUpdate timestamp
    await this.prisma.grievance.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return comment;
  }

  async escalate(id: string, userId: string) {
    const grievance = await this.findOne(id);

    if (grievance.status === GrievanceStatus.ESCALATED) {
      throw new BadRequestException('Grievance is already escalated');
    }
    if (grievance.status === GrievanceStatus.RESOLVED) {
      throw new BadRequestException('Cannot escalate a resolved grievance');
    }

    const updated = await this.prisma.grievance.update({
      where: { id },
      data: {
        status: GrievanceStatus.ESCALATED,
        escalatedAt: new Date(),
      },
    });

    // Auto-add escalation comment
    await this.prisma.grievanceComment.create({
      data: {
        grievanceId: id,
        content: `Grievance escalated by user`,
        createdBy: userId,
      },
    });

    return updated;
  }

  async getMetrics() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [total, byStatus, byCategory, byPriority, trendResult, resolvedGrievances] = await Promise.all([
      this.prisma.grievance.count(),
      this.prisma.grievance.groupBy({ by: ['status'], _count: true }),
      this.prisma.grievance.groupBy({ by: ['category'], _count: true }),
      this.prisma.grievance.groupBy({ by: ['priority'], _count: true }),
      this.prisma.grievance.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      this.prisma.grievance.findMany({
        where: { status: GrievanceStatus.RESOLVED },
        select: { createdAt: true, updatedAt: true },
      }),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    
    // Monthly trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
      trendMap[key] = 0;
    }

    trendResult.forEach((g) => {
      const d = g.createdAt;
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
      if (trendMap[key] !== undefined) trendMap[key]++;
    });

    const trendData = Object.entries(trendMap)
      .map(([name, cases]) => ({ name, cases }))
      .reverse();

    // Resolution Time Calculations
    let avgResolutionDays = 0;
    const distribution = {
      under24h: 0,
      days1_3: 0,
      days3_7: 0,
      over7d: 0,
    };

    if (resolvedGrievances.length > 0) {
      let totalMs = 0;
      resolvedGrievances.forEach((g) => {
        const diff = g.updatedAt.getTime() - g.createdAt.getTime();
        totalMs += diff;
        
        const hours = diff / (1000 * 60 * 60);
        if (hours < 24) distribution.under24h++;
        else if (hours < 72) distribution.days1_3++;
        else if (hours < 168) distribution.days3_7++;
        else distribution.over7d++;
      });
      avgResolutionDays = Math.round((totalMs / resolvedGrievances.length / (1000 * 60 * 60 * 24)) * 10) / 10;
    }

    const resolutionTimeDistribution = [
      { name: "< 24 hours", value: distribution.under24h, color: "hsl(142, 76%, 36%)" },
      { name: "1-3 days", value: distribution.days1_3, color: "hsl(199, 89%, 48%)" },
      { name: "3-7 days", value: distribution.days3_7, color: "hsl(38, 92%, 50%)" },
      { name: "> 7 days", value: distribution.over7d, color: "hsl(0, 72%, 51%)" },
    ];

    return {
      total,
      open: statusMap[GrievanceStatus.OPEN] || 0,
      inProgress: statusMap[GrievanceStatus.IN_PROGRESS] || 0,
      resolved: statusMap[GrievanceStatus.RESOLVED] || 0,
      escalated: statusMap[GrievanceStatus.ESCALATED] || 0,
      trendData,
      avgResolutionDays,
      resolutionTimeDistribution,
      byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count])),
    };
  }
}
