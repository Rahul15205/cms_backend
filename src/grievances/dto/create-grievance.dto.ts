import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GrievanceCategory, GrievancePriority } from '@prisma/client';

export class CreateGrievanceDto {
  @ApiProperty({ example: 'Unable to access my personal data' })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiPropertyOptional({ example: 'I submitted a data access request 2 weeks ago but received no response.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'user-uuid' })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiProperty({ enum: GrievanceCategory })
  @IsNotEmpty()
  @IsEnum(GrievanceCategory)
  category!: GrievanceCategory;

  @ApiPropertyOptional({ enum: GrievancePriority, default: 'GRV_MEDIUM' })
  @IsOptional()
  @IsEnum(GrievancePriority)
  priority?: GrievancePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
