import { PartialType } from '@nestjs/swagger';
import { CreateAccessRuleDto } from './create-access-rule.dto';

export class UpdateAccessRuleDto extends PartialType(CreateAccessRuleDto) {}
