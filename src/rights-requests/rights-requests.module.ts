import { Module } from '@nestjs/common';
import { RightsRequestsController } from './rights-requests.controller';
import { RightsRequestsService } from './rights-requests.service';

@Module({
  controllers: [RightsRequestsController],
  providers: [RightsRequestsService],
  exports: [RightsRequestsService],
})
export class RightsRequestsModule {}
