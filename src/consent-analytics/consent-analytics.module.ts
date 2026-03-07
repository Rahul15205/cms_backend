import { Module } from '@nestjs/common';
import { ConsentAnalyticsController } from './consent-analytics.controller';
import { ConsentAnalyticsService } from './consent-analytics.service';

@Module({
  controllers: [ConsentAnalyticsController],
  providers: [ConsentAnalyticsService],
})
export class ConsentAnalyticsModule {}
