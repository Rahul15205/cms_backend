import { PartialType } from '@nestjs/swagger';
import { CreateDataCategoryDto } from './create-data-category.dto';

export class UpdateDataCategoryDto extends PartialType(CreateDataCategoryDto) {}
