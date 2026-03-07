import { Module } from '@nestjs/common';
import { AadhaarConfigController } from './aadhaar-config.controller';
import { AadhaarConfigService } from './aadhaar-config.service';

@Module({
  controllers: [AadhaarConfigController],
  providers: [AadhaarConfigService],
  exports: [AadhaarConfigService],
})
export class AadhaarConfigModule {}
