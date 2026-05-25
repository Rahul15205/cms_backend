import { Module } from '@nestjs/common';
import { ConsentWidgetController } from './consent-widget.controller';
import { ConsentWidgetPublicController } from './consent-widget-public.controller';
import { ConsentWidgetService } from './consent-widget.service';
import { ConsentOtpService } from './consent-otp.service';
import { ConsentParentalService } from './consent-parental.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { AadhaarModule } from '../aadhaar/aadhaar.module';

@Module({
  imports: [PrismaModule, EncryptionModule, AadhaarModule],
  controllers: [ConsentWidgetController, ConsentWidgetPublicController],
  providers: [ConsentWidgetService, ConsentOtpService, ConsentParentalService],
  exports: [ConsentWidgetService, ConsentOtpService, ConsentParentalService],
})
export class ConsentWidgetModule {}
