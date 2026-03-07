import { IsBoolean, IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAadhaarConfigDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 'sandbox' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ default: 'otp' })
  @IsOptional()
  @IsString()
  verificationMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usageScopes?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  consentRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consentText?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  consentRetentionDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoPurgeEnabled?: boolean;

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @IsInt()
  autoPurgeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceProviderName?: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  rateLimit?: number;
}
