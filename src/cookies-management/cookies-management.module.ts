import { Module } from '@nestjs/common';
import { CookiesManagementController } from './cookies-management.controller';
import { CookiesManagementService } from './cookies-management.service';

@Module({
  controllers: [CookiesManagementController],
  providers: [CookiesManagementService]
})
export class CookiesManagementModule {}
