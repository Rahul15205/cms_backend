import { Module } from '@nestjs/common';
import { LogRetentionController } from './log-retention.controller';
import { LogRetentionService } from './log-retention.service';

@Module({
  controllers: [LogRetentionController],
  providers: [LogRetentionService],
  exports: [LogRetentionService],
})
export class LogRetentionModule {}
