import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from 'nestjs-pino';

export interface ISendInvitationArgs {
  to: string;
  role: string;
  inviteUrl: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly logger: Logger,
  ) {}

  async sendInvitationEmail(args: ISendInvitationArgs): Promise<boolean> {
    try {
      this.logger.log(`Dispatching invitation email to ${args.to}`);
      
      await this.mailerService.sendMail({
        to: args.to,
        subject: 'You have been invited to Proteccio CMS',
        template: 'invitation', 
        context: {
          role: args.role,
          inviteUrl: args.inviteUrl,
          year: new Date().getFullYear(),
        },
      });
      
      this.logger.log(`Invitation email successfully sent to ${args.to}`);
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send invitation email to ${args.to}`);
      return false;
    }
  }

  async sendRightsRequestConfirmation(email: string, name: string, caseNumber: string, requestType: string, regulation: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching rights request confirmation to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Request Received: ${caseNumber}`,
        template: 'rights-request-created',
        context: { name, caseNumber, requestType, regulation, year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send confirmation email to ${email}`);
      return false;
    }
  }

  async sendNewRightsRequestAlert(adminEmail: string, data: { caseNumber: string, requesterName: string, requestType: string, regulation: string, priority: string }): Promise<boolean> {
    try {
      this.logger.log(`Dispatching admin alert for ${data.caseNumber} to ${adminEmail}`);
      await this.mailerService.sendMail({
        to: adminEmail,
        subject: `ACTION REQUIRED: New Rights Request ${data.caseNumber}`,
        template: 'rights-request-admin-alert',
        context: { ...data, dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000', year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send admin alert to ${adminEmail}`);
      return false;
    }
  }

  async sendRightsRequestStatusUpdate(email: string, name: string, caseNumber: string, requestType: string, status: string, note?: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching status update for ${caseNumber} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Update on your request: ${caseNumber}`,
        template: 'rights-request-status-update',
        context: { name, caseNumber, requestType, status, note, year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send status update to ${email}`);
      return false;
    }
  }

  async sendGrievanceConfirmation(email: string, name: string, caseNumber: string, subject: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching grievance confirmation to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Grievance Received: ${caseNumber}`,
        template: 'grievance-received',
        context: { name, caseNumber, subject, date: new Date().toLocaleDateString(), year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send grievance confirmation to ${email}`);
      return false;
    }
  }

  async sendGrievanceUpdateAlert(email: string, name: string, caseNumber: string, status: string, comment: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching grievance update for ${caseNumber} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Update on Grievance: ${caseNumber}`,
        template: 'grievance-update',
        context: { name, caseNumber, status, comment, year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send grievance update to ${email}`);
      return false;
    }
  }

  async sendSLABreachAlert(adminEmail: string, data: { caseNumber: string, dueDate: string, daysRemaining: number, requestType: string, priority: string, status: string, isNearBreach: boolean }): Promise<boolean> {
    try {
      const subject = data.isNearBreach 
        ? `SLA WARNING: ${data.caseNumber} approaching breach` 
        : `SLA BREACH ALERT: ${data.caseNumber} has exceeded its due date`;

      this.logger.warn(`Dispatching SLA alert for ${data.caseNumber} to ${adminEmail}`);
      
      await this.mailerService.sendMail({
        to: adminEmail,
        subject,
        template: 'sla-breach-alert',
        context: { ...data, dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000', year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send SLA alert to ${adminEmail}`);
      return false;
    }
  }

  async sendDsarDownloadReady(email: string, name: string, downloadUrl: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching DSAR download ready notification to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Data Request is ready for download',
        template: './dsar-download-ready',
        context: { name, downloadUrl, year: new Date().getFullYear() },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send DSAR download link to ${email}`);
      return false;
    }
  }

  async sendErasureConfirmation(email: string, name: string, caseId: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching erasure confirmation for ${caseId} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Data Erasure Confirmation',
        template: './erasure-confirmation',
        context: { 
          name, 
          caseId, 
          completionDate: new Date().toLocaleDateString(),
          year: new Date().getFullYear() 
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send erasure confirmation to ${email}`);
      return false;
    }
  }

  async sendConsentReceipt(email: string, name: string, data: any): Promise<boolean> {
    try {
      this.logger.log(`Dispatching consent receipt for ${data.recordId} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Proof of Consent: ${data.templateTitle}`,
        template: './consent-receipt',
        context: { 
          ...data,
          name,
          year: new Date().getFullYear(),
          withdrawalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/rights-requests/withdraw?id=${data.recordId}`
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send consent receipt for ${data.recordId} to ${email}`);
      return false;
    }
  }

  async sendCookieScanCompletionEmail(email: string, websiteName: string, stats: any): Promise<boolean> {
    try {
      this.logger.log(`Dispatching cookie scan report for ${websiteName} to ${email}`);
      const template = stats.isPeriodic ? 'cookie-scan-periodic-report' : 'cookie-scan-report';
      const subject = stats.isPeriodic 
        ? `Your Scheduled Website Compliance Report – ${websiteName}`
        : `Your Website Scan Report is Ready – Compliance & Risk Summary`;

      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: template,
        context: {
          websiteName,
          ...stats,
          dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          year: new Date().getFullYear(),
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send cookie scan report to ${email}`);
      return false;
    }
  }

  async sendComplianceReport(email: string, websiteName: string, filePath: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching compliance report for ${websiteName} to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: `Compliance Report: ${websiteName}`,
        template: 'compliance-report',
        context: {
          websiteName,
          dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          year: new Date().getFullYear(),
        },
        attachments: [
          {
            filename: `Compliance_Report_${websiteName.replace(/\s+/g, '_')}.pdf`,
            path: filePath,
          }
        ]
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send compliance report to ${email}`);
      return false;
    }
  }

  async sendWelcomeCredentials(email: string, name: string, tempPassword: string, loginUrl: string): Promise<boolean> {
    try {
      this.logger.log(`Dispatching welcome credentials email to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Proteccio CMS - Your Temporary Credentials',
        template: 'welcome-credentials',
        context: {
          name,
          email,
          tempPassword,
          loginUrl,
          year: new Date().getFullYear(),
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send welcome credentials to ${email}`);
      return false;
    }
  }

  async sendConsentVerificationOtp(
    email: string,
    otp: string,
    expiresInMinutes: number,
  ): Promise<boolean> {
    try {
      this.logger.log(`Dispatching consent verification OTP to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your consent — Proteccio',
        template: 'password-reset-otp',
        context: {
          name: 'User',
          otp,
          expiresInMinutes,
          year: new Date().getFullYear(),
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send consent OTP to ${email}`);
      return false;
    }
  }

  async sendPasswordResetOtp(email: string, name: string, otp: string, expiresInMinutes: number): Promise<boolean> {
    try {
      this.logger.log(`Dispatching password reset OTP to ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Proteccio CMS Password Reset OTP',
        template: 'password-reset-otp',
        context: {
          name,
          otp,
          expiresInMinutes,
          year: new Date().getFullYear(),
        },
      });
      return true;
    } catch (error) {
      this.logger.error({ err: error }, `Failed to send password reset OTP to ${email}`);
      return false;
    }
  }
}
