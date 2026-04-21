import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CookiesManagementController } from './cookies-management.controller';
import { CookieBannerPublicController } from './cookie-banner-public.controller';
import { CookiesManagementService } from './cookies-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CookieScannerProcessor } from './cookie-scanner.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue(
      { name: 'cookie-scanner' }
    ),
  ],
  controllers: [CookiesManagementController, CookieBannerPublicController],
  providers: [CookiesManagementService, CookieScannerProcessor],
  exports: [CookiesManagementService],
})
export class CookiesManagementModule {}
