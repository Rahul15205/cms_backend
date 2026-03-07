import { IsString, IsNotEmpty, IsArray, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigRuleStatus } from '@prisma/client';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: ['read:consent', 'write:consent'] })
  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: ConfigRuleStatus, default: ConfigRuleStatus.CFG_ACTIVE })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
