import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogType, ConfigRuleStatus } from '@prisma/client';

export class CreateLogRetentionRuleDto {
  @ApiProperty({ enum: LogType })
  @IsNotEmpty()
  @IsEnum(LogType)
  logType!: LogType;

  @ApiProperty({ default: 365 })
  @IsNotEmpty()
  @IsInt()
  retentionPeriod!: number;

  @ApiProperty({ default: 'days' })
  @IsNotEmpty()
  @IsString()
  retentionUnit!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regulation?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoArchive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoDelete?: boolean;

  @ApiPropertyOptional({ enum: ConfigRuleStatus })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
