import { Module } from '@nestjs/common';
import { ConsentDeploymentsService } from './consent-deployments.service';
import { ConsentDeploymentsController } from './consent-deployments.controller';

@Module({
  controllers: [ConsentDeploymentsController],
  providers: [ConsentDeploymentsService],
})
export class ConsentDeploymentsModule {}
