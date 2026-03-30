import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CookiesManagementController } from './cookies-management.controller';
import { CookiesManagementService } from './cookies-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CookieScannerProcessor } from './cookie-scanner.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'cookie-scanner' }
    ),
  ],
  controllers: [CookiesManagementController],
  providers: [CookiesManagementService, CookieScannerProcessor],
  exports: [CookiesManagementService],
})
export class CookiesManagementModule {}
