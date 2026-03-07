import { Module } from '@nestjs/common';
import { EscalationRulesController } from './escalation-rules.controller';
import { EscalationRulesService } from './escalation-rules.service';

@Module({
  controllers: [EscalationRulesController],
  providers: [EscalationRulesService],
  exports: [EscalationRulesService],
})
export class EscalationRulesModule {}
