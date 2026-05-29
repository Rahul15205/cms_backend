import { Module } from '@nestjs/common'; // PHASE 6 CHANGE
import { PublicIntakeController } from './public-intake.controller'; // PHASE 6 CHANGE
import { ApiKeysModule } from '../api-keys/api-keys.module'; // PHASE 6 CHANGE
import { RightsRequestsModule } from '../rights-requests/rights-requests.module'; // PHASE 6 CHANGE

@Module({
  imports: [
    ApiKeysModule, // PHASE 6 CHANGE
    RightsRequestsModule, // PHASE 6 CHANGE
  ],
  controllers: [PublicIntakeController], // PHASE 6 CHANGE
})
export class PublicModule {}
