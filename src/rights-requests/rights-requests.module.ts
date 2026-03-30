import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EncryptionModule } from '../encryption/encryption.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RightsRequestsController } from './rights-requests.controller';
import { RightsRequestsService } from './rights-requests.service';
import { SlaMonitorProcessor } from './sla-monitor.processor';
import { ErasureProcessor } from './erasure.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule, 
    NotificationsModule,
    ReportsModule,
    BullModule.registerQueue(
      { name: 'sla-monitor' },
      { name: 'erasure' }
    ),
  ],
  controllers: [RightsRequestsController],
  providers: [RightsRequestsService, SlaMonitorProcessor, ErasureProcessor],
  exports: [RightsRequestsService],
})
export class RightsRequestsModule {}
