import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, ReportType } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reports') private readonly reportsQueue: Queue
  ) {}

  async create(dto: CreateReportDto, userId: string, userTenantId?: string) {
    const report = await this.prisma.generatedReport.create({
      data: {
        name: dto.name,
        reportType: dto.reportType,
        format: dto.format ?? 'CSV',
        generatedBy: userId,
        parameters: dto.parameters ?? {},
        tenantId: dto.tenantId ?? userTenantId,
        status: 'RPT_PENDING',
      },
    });

    // Queue the background job asynchronously
    await this.reportsQueue.add('generate', {
      reportId: report.id,
      format: report.format,
      type: report.reportType,
      tenantId: report.tenantId,
    });

    return report;
  }

  async findAll(tenantId?: string, reportType?: ReportType, limit?: number, offset?: number) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (reportType) where.reportType = reportType;

    const [data, total] = await Promise.all([
      this.prisma.generatedReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit ? Number(limit) : 50,
        skip: offset ? Number(offset) : 0,
      }),
      this.prisma.generatedReport.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const report = await this.prisma.generatedReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async download(id: string) {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.RPT_COMPLETED) {
      throw new NotFoundException('Report is not ready for download');
    }
    if (!report.filePath) {
      throw new NotFoundException('File path not found on the generated report');
    }
    return report;
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.generatedReport.delete({ where: { id } });
  }

}
