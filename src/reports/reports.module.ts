import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { ReportGeneratorProcessor } from './report-generator.processor';
import { EncryptionModule } from '../encryption/encryption.module';
import { StorageModule } from '../common/storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    StorageModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'reports',
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportGeneratorProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
