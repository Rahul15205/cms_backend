import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsentVersionDto {
  @ApiProperty({ example: 'html-content-string-here' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({ example: 'uuid-template-id' })
  @IsNotEmpty()
  @IsString()
  templateId!: string;

  @ApiPropertyOptional({ example: 'Updated data sharing clause' })
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @ApiPropertyOptional({ example: ['dataSharing', 'thirdParties'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changedFields?: string[];

  @ApiPropertyOptional({ example: 'Regulatory requirement update' })
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2027-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  reconsentTriggered?: boolean;
}
