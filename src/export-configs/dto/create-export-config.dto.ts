import { IsString, IsNotEmpty, IsArray, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigRuleStatus } from '@prisma/client';

export class CreateExportConfigDto {
  @ApiProperty({ example: 'Monthly Compliance Report' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'COMPLIANCE' })
  @IsNotEmpty()
  @IsString()
  reportType!: string;

  @ApiPropertyOptional({ default: 'csv' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ default: 'on-demand' })
  @IsOptional()
  @IsString()
  scheduleFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiProperty({ example: ['admin@example.com'] })
  @IsArray()
  @IsString({ each: true })
  recipients!: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  dataMaskingEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  brandingEnabled?: boolean;

  @ApiPropertyOptional({ enum: ConfigRuleStatus })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
