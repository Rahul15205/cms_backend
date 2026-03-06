import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStatus } from '@prisma/client';

export class CreateConsentTemplateDto {
  @ApiProperty({ example: 'Terms of Service v1' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Standard terms of service agreement for end-users.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TemplateStatus, example: TemplateStatus.DRAFT })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({ example: { requireSignature: true, questions: [{ id: 'q1', text: 'Do you agree?', type: 'checkbox' }] } })
  @IsOptional()
  @IsObject()
  wizardFields?: Record<string, any>;
}
