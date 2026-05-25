import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CookiesManagementController } from './cookies-management.controller';
import { CookieBannerPublicController } from './cookie-banner-public.controller';
import { CookiesManagementService } from './cookies-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CookieScannerProcessor } from './cookie-scanner.processor';
import { ScannerSchedulerService } from './scanner-scheduler.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceScannerService } from './compliance-scanner.service';
import { CookieClassifierService } from './cookie-classifier.service';
import { CookieComplianceReportService } from './cookie-compliance-report.service';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue(
      { name: 'cookie-scanner' }
    ),
  ],
  controllers: [CookiesManagementController, CookieBannerPublicController],
  providers: [
    CookiesManagementService,
    CookieScannerProcessor,
    ScannerSchedulerService,
    ComplianceScannerService,
    CookieClassifierService,
    CookieComplianceReportService,
  ],
  exports: [
    CookiesManagementService,
    ComplianceScannerService,
    CookieClassifierService,
    CookieComplianceReportService,
  ],
})
export class CookiesManagementModule {}
