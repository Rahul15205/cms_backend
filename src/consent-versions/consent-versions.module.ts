import { Module } from '@nestjs/common';
import { ConsentVersionsService } from './consent-versions.service';
import { ConsentVersionsController } from './consent-versions.controller';

@Module({
  controllers: [ConsentVersionsController],
  providers: [ConsentVersionsService],
})
export class ConsentVersionsModule {}
