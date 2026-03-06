import { Module } from '@nestjs/common';
import { AccessRulesController } from './access-rules.controller';
import { AccessRulesService } from './access-rules.service';

@Module({
  controllers: [AccessRulesController],
  providers: [AccessRulesService]
})
export class AccessRulesModule {}
