import { Module } from '@nestjs/common';
import { SlaRulesController } from './sla-rules.controller';
import { SlaRulesService } from './sla-rules.service';

@Module({
  controllers: [SlaRulesController],
  providers: [SlaRulesService],
  exports: [SlaRulesService],
})
export class SlaRulesModule {}
