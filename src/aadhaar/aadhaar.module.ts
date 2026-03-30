import { Module } from '@nestjs/common';
import { AadhaarService } from './aadhaar.service';
import { AadhaarController } from './aadhaar.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    CacheModule.register(), // Ensure cache is available
  ],
  controllers: [AadhaarController],
  providers: [AadhaarService],
  exports: [AadhaarService],
})
export class AadhaarModule {}
