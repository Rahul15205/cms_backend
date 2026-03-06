import { PartialType } from '@nestjs/swagger';
import { CreateRightsRequestDto } from './create-rights-request.dto';

export class UpdateRightsRequestDto extends PartialType(CreateRightsRequestDto) {}
