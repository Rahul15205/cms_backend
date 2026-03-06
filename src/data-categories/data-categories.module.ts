import { Module } from '@nestjs/common';
import { DataCategoriesService } from './data-categories.service';
import { DataCategoriesController } from './data-categories.controller';

@Module({
  controllers: [DataCategoriesController],
  providers: [DataCategoriesService],
})
export class DataCategoriesModule {}
