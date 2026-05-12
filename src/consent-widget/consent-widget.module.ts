import { Module } from '@nestjs/common';
import { ConsentWidgetController } from './consent-widget.controller';
import { ConsentWidgetPublicController } from './consent-widget-public.controller';
import { ConsentWidgetService } from './consent-widget.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [PrismaModule, EncryptionModule],
  controllers: [ConsentWidgetController, ConsentWidgetPublicController],
  providers: [ConsentWidgetService],
  exports: [ConsentWidgetService],
})
export class ConsentWidgetModule {}
