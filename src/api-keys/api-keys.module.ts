import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyService } from './api-key.service'; // PHASE 6 CHANGE
import { ApiKeyGuard } from './api-key.guard'; // PHASE 6 CHANGE

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyService, ApiKeyGuard], // PHASE 6 CHANGE
  exports: [ApiKeysService, ApiKeyService, ApiKeyGuard], // PHASE 6 CHANGE
})
export class ApiKeysModule {}
