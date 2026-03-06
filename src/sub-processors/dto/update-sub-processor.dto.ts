import { PartialType } from '@nestjs/swagger';
import { CreateSubProcessorDto } from './create-sub-processor.dto';

export class UpdateSubProcessorDto extends PartialType(CreateSubProcessorDto) {}
