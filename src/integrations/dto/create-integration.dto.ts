import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationType } from '@prisma/client';

export class CreateIntegrationDto {
  @ApiProperty({ example: 'Salesforce CRM' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: IntegrationType, example: 'CRM' })
  @IsOptional()
  @IsEnum(IntegrationType)
  type?: IntegrationType;

  @ApiPropertyOptional({ example: 'salesforce-icon' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: { apiKey: 'xxx', endpoint: 'https://api.salesforce.com' }, description: 'Connection configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
