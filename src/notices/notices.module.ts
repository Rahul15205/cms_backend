import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller';
import { NoticePublicController } from './notice-public.controller';
import { NoticesService } from './notices.service';

@Module({
  controllers: [NoticesController, NoticePublicController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
