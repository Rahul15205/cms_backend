import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, ReportType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReportDto, userId: string) {
    const report = await this.prisma.generatedReport.create({
      data: {
        name: dto.name,
        reportType: dto.reportType,
        format: dto.format ?? 'CSV',
        generatedBy: userId,
        parameters: dto.parameters ?? {},
        tenantId: dto.tenantId,
        status: 'RPT_PENDING',
      },
    });

    // Simulate async report generation — mark as completed immediately
    // In production, this would queue a background job
    const counts = await this.gatherReportData(dto.reportType, dto.tenantId);

    const updated = await this.prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        status: 'RPT_COMPLETED',
        completedAt: new Date(),
        filePath: `/reports/${report.id}.${(dto.format ?? 'CSV').toLowerCase()}`,
        fileSize: JSON.stringify(counts).length,
      },
    });

    return updated;
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
    // In production, this would stream the file from storage
    // For now return the report metadata with the file path
    return {
      id: report.id,
      name: report.name,
      format: report.format,
      filePath: report.filePath,
      fileSize: report.fileSize,
      message: 'File download endpoint — in production this would stream the file',
    };
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.generatedReport.delete({ where: { id } });
  }

  // -------------------------------------------------------
  // Private: Gather summary data for the report
  // -------------------------------------------------------
  private async gatherReportData(reportType: ReportType, tenantId?: string) {
    switch (reportType) {
      case 'CONSENT':
        return {
          totalTemplates: await this.prisma.consentTemplate.count(tenantId ? { where: { tenantId } } : undefined),
          totalRecords: await this.prisma.consentRecord.count(),
          totalDeployments: await this.prisma.consentDeployment.count(),
        };
      case 'RIGHTS':
        return {
          totalRequests: await this.prisma.rightsRequest.count(tenantId ? { where: { tenantId } } : undefined),
          totalGrievances: await this.prisma.grievance.count(tenantId ? { where: { tenantId } } : undefined),
        };
      case 'COMPLIANCE':
        return {
          totalSlaRules: await this.prisma.slaRule.count(tenantId ? { where: { tenantId } } : undefined),
          totalNotices: await this.prisma.notice.count(tenantId ? { where: { tenantId } } : undefined),
        };
      case 'AUDIT':
        return {
          totalLogs: await this.prisma.auditLog.count(tenantId ? { where: { tenantId } } : undefined),
        };
      default:
        return {};
    }
  }
}
