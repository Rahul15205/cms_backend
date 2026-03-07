import { Module } from '@nestjs/common';
import { ExportConfigsController } from './export-configs.controller';
import { ExportConfigsService } from './export-configs.service';

@Module({
  controllers: [ExportConfigsController],
  providers: [ExportConfigsService],
  exports: [ExportConfigsService],
})
export class ExportConfigsModule {}
