import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigRuleStatus } from '@prisma/client';

export class UpdateEncryptionConfigDto {
  @ApiPropertyOptional({ default: 'AES-256-GCM' })
  @IsOptional()
  @IsString()
  algorithm?: string;

  @ApiPropertyOptional({ default: 90 })
  @IsOptional()
  @IsInt()
  keyRotationDays?: number;

  @ApiPropertyOptional({ default: 'KMS' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ enum: ConfigRuleStatus })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;
}
