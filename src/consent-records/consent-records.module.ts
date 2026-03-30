import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConsentRecordsService } from './consent-records.service';
import { ConsentRecordsController } from './consent-records.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConsentReceiptProcessor } from './consent-receipt.processor';

@Module({
  imports: [
    PrismaModule, 
    EncryptionModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'consent-receipts',
    }),
  ],
  controllers: [ConsentRecordsController],
  providers: [ConsentRecordsService, ConsentReceiptProcessor],
})
export class ConsentRecordsModule {}
