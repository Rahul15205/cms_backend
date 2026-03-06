import { Module } from '@nestjs/common';
import { SubProcessorsService } from './sub-processors.service';
import { SubProcessorsController } from './sub-processors.controller';

@Module({
  controllers: [SubProcessorsController],
  providers: [SubProcessorsService],
})
export class SubProcessorsModule {}
