import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigRuleStatus } from '@prisma/client';

export class CreateWorkflowConfigDto {
  @ApiProperty({ example: 'Standard Rights Workflow' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'RIGHTS' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ example: [{ step: 1, role: 'DPO', action: 'APPROVE' }] })
  @IsNotEmpty()
  @IsObject()
  steps!: any;

  @ApiPropertyOptional({ enum: ConfigRuleStatus })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;
}
