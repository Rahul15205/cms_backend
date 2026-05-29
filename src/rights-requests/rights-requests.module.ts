import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EncryptionModule } from '../encryption/encryption.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RightsRequestsController } from './rights-requests.controller';
import { RightsRequestsService } from './rights-requests.service';
import { WorkflowTemplateService } from './workflow-template.service'; // PHASE 2 CHANGE
import { SlaRuleService } from './sla-rule.service'; // PHASE 4 CHANGE
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
  providers: [RightsRequestsService, SlaMonitorProcessor, ErasureProcessor, WorkflowTemplateService, SlaRuleService], // PHASE 4 CHANGE
  exports: [RightsRequestsService],
})
export class RightsRequestsModule {}
