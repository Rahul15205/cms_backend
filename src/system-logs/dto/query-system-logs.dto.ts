import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SystemLogCategory } from '@prisma/client';

export class QuerySystemLogsDto {
  @ApiPropertyOptional({ enum: SystemLogCategory })
  @IsEnum(SystemLogCategory)
  @IsOptional()
  category?: SystemLogCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  offset?: number;
}
