import { Module } from '@nestjs/common';
import { ConsentRecordsService } from './consent-records.service';
import { ConsentRecordsController } from './consent-records.controller';

@Module({
  controllers: [ConsentRecordsController],
  providers: [ConsentRecordsService],
})
export class ConsentRecordsModule {}
