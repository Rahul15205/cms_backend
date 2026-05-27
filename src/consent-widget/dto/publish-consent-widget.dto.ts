import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublishConsentWidgetDto {
  @ApiPropertyOptional({ description: 'Consent version to deploy; defaults to latest template version' })
  @IsOptional()
  @IsString()
  versionId?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: ['Web'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platform?: string[];
}
