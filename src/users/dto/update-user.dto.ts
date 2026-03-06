import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: ['uuid-of-role1', 'uuid-of-role2'] })
  @IsOptional()
  @IsUUID('all', { each: true })
  roles?: string[];
}
