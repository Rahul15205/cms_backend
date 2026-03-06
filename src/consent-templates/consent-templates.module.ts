import { Module } from '@nestjs/common';
import { ConsentTemplatesService } from './consent-templates.service';
import { ConsentTemplatesController } from './consent-templates.controller';

@Module({
  controllers: [ConsentTemplatesController],
  providers: [ConsentTemplatesService],
})
export class ConsentTemplatesModule {}
