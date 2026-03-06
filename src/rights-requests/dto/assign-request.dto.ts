import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRequestDto {
  @ApiPropertyOptional({ example: 'user-uuid', description: 'User ID to assign to' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'Privacy Team', description: 'Team name to assign to' })
  @IsOptional()
  @IsString()
  assignedTeam?: string;
}
