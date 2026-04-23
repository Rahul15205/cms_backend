import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { ReportStatus, ReportType } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface ReportJobData {
  reportId: string;
  format: 'CSV' | 'PDF' | 'JSON' | 'XLSX';
  type: string;
  tenantId?: string;
}

@Processor('reports')
export class ReportGeneratorProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGeneratorProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly encryptionService: EncryptionService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<any> {
    const { reportId, format, type } = job.data;
    this.logger.log(`Processing report job: ${job.id} for report: ${reportId}`);

    try {
      // 1. Update status to RPT_PROCESSING
      await this.prisma.generatedReport.update({
        where: { id: reportId },
        data: { status: ReportStatus.RPT_PROCESSING }
      });

      let cloudPath = '';
      let localPath = '';
      if (type === ReportType.DSAR_EXPORT) {
        cloudPath = await this.generateDsarExport(job.data);
      } else {
        localPath = await this.generateStandardReport(job.data);
        const fileName = path.basename(localPath);
        const cloudPathPrefix = job.data.tenantId ? `reports/${job.data.tenantId}/` : 'reports/system/';
        cloudPath = `${cloudPathPrefix}${fileName}`;

        const fileBuffer = fs.readFileSync(localPath);
        await this.storageService.uploadFile(cloudPath, fileBuffer, this.getMimeType(format));
      }

      // 2. Update status to RPT_COMPLETED
      const updatedReport = await this.prisma.generatedReport.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.RPT_COMPLETED,
          filePath: cloudPath,
          completedAt: new Date(),
        }
      });

      // 3. Send email notification if email is provided in parameters
      const params = updatedReport.parameters as any;
      if (params?.email && type === ReportType.COMPLIANCE && localPath) {
        await this.notificationsService.sendComplianceReport(
          params.email,
          params.websiteName || 'Your Website',
          localPath
        );
      }

      // 4. Cleanup local file
      if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      this.logger.log(`Report ${reportId} successfully generated and stored at ${cloudPath}`);
      return { cloudPath };
    } catch (error) {
      this.logger.error(`Failed to generate report ${reportId}: ${error.message}`, error.stack);
      
      await this.prisma.generatedReport.update({
        where: { id: reportId },
        data: { 
          status: ReportStatus.RPT_FAILED,
          error: error.message
        }
      });

      throw error;
    }
  }

  private async generateStandardReport(data: ReportJobData): Promise<string> {
     const tempDir = path.join(process.cwd(), 'tmp');
     if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
     const filePath = path.join(tempDir, `report-${data.reportId}.${data.format.toLowerCase()}`);
     
     if (data.format === 'PDF') {
        await this.generatePdf(data, filePath);
     } else {
        fs.writeFileSync(filePath, 'Report ID, Status, Generated At\n' + `${data.reportId}, RPT_COMPLETED, ${new Date().toISOString()}`);
     }
     
     return filePath;
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'PDF': return 'application/pdf';
      case 'CSV': return 'text/csv';
      case 'XLSX': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'JSON': return 'application/json';
      default: return 'application/octet-stream';
    }
  }

  private async generatePdf(data: ReportJobData, filePath: string): Promise<void> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      stream.on('finish', () => resolve());

      doc.fontSize(20).text('Proteccio Compliance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Report ID: ${data.reportId}`);
      doc.text(`Tenant ID: ${data.tenantId || 'All Tenants'}`);
      doc.text(`Generated At: ${new Date().toISOString()}`);
      doc.moveDown();
      doc.text('This is an auto-generated system report pulled securely directly from the database.', { align: 'justify' });
      
      doc.end();
    });
  }

  private async generateDsarExport(jobData: ReportJobData): Promise<string> {
    const report = await this.prisma.generatedReport.findUnique({
      where: { id: jobData.reportId }
    });
    
    if (!report || !report.parameters) {
      throw new Error('Invalid report parameters for DSAR export');
    }

    const params = report.parameters as any;
    const email = params.email;
    const phone = params.phone;

    if (!email && !phone) {
      throw new Error('DSAR export requires either email or phone parameter');
    }

    const emailHash = email ? this.encryptionService.generateHash(email) : null;
    const phoneHash = phone ? this.encryptionService.generateHash(phone) : null;

    // 1. Fetch Consent Records
    const consents = await this.prisma.consentRecord.findMany({
      where: {
        OR: [
          emailHash ? { endUserEmailHash: emailHash } : null,
          phoneHash ? { endUserPhoneHash: phoneHash } : null,
        ].filter((cond): cond is any => cond !== null)
      },
      include: {
        version: { include: { template: true } },
        application: true
      }
    });

    // 2. Fetch Rights Requests
    const rightsRequests = await this.prisma.rightsRequest.findMany({
      where: {
        OR: [
          emailHash ? { requesterEmailHash: emailHash } : null,
          phoneHash ? { requesterPhoneHash: phoneHash } : null,
        ].filter((cond): cond is any => cond !== null)
      }
    });

    // 3. Fetch Grievances
    const grievances = await this.prisma.grievance.findMany({
      where: {
        OR: [
          emailHash ? { userEmailHash: emailHash } : null,
        ].filter((cond): cond is any => cond !== null)
      }
    });

    const dataPackage = {
      subject: {
        email: email || 'N/A',
        phone: phone || 'N/A',
        exportedAt: new Date().toISOString()
      },
      consents: consents.map((c: any) => ({
        id: c.id,
        template: c.version.template.title,
        version: c.version.versionNumber,
        status: c.status,
        grantedAt: c.grantedAt,
        revokedAt: c.revokedAt,
        application: c.application.name,
        metadata: c.metadata
      })),
      requests: rightsRequests.map((r: any) => ({
        caseNumber: r.caseNumber,
        type: r.type,
        status: r.status,
        regulation: r.regulation,
        createdAt: r.createdAt,
        dueDate: r.dueDate
      })),
      grievances: grievances.map((g: any) => ({
        caseNumber: g.caseNumber,
        subject: g.subject,
        category: g.category,
        status: g.status,
        createdAt: g.createdAt,
        priority: g.priority
      }))
    };

    const cloudPath = `exports/dsar/${jobData.reportId}.json`;
    const buffer = Buffer.from(JSON.stringify(dataPackage, null, 2));

    await this.storageService.uploadFile(cloudPath, buffer, 'application/json');

    const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/reports/download/${jobData.reportId}`;
    await this.notificationsService.sendDsarDownloadReady(
      email || params.email || 'requester',
      params.name || 'Data Subject',
      downloadUrl
    );

    return cloudPath;
  }
}
