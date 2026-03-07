import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SLADurationUnit, SLADayType, SLAScope, SLARuleStatus, Regulation, RightsRequestType } from '@prisma/client';

export class CreateSlaRuleDto {
  @ApiProperty({ example: 'DPDP Access Request SLA' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: Regulation, example: 'DPDP' })
  @IsOptional()
  @IsEnum(Regulation)
  regulation?: Regulation;

  @ApiPropertyOptional({ enum: RightsRequestType, example: 'ACCESS', description: 'Only applicable when scope = RIGHTS' })
  @IsOptional()
  @IsEnum(RightsRequestType)
  rightType?: RightsRequestType;

  @ApiPropertyOptional({ example: 'DATA_ACCESS', description: 'Grievance category or custom label' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'URGENT' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ example: 30, description: 'Duration value for SLA deadline' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ enum: SLADurationUnit, example: 'DAYS' })
  @IsOptional()
  @IsEnum(SLADurationUnit)
  durationUnit?: SLADurationUnit;

  @ApiPropertyOptional({ enum: SLADayType, example: 'CALENDAR' })
  @IsOptional()
  @IsEnum(SLADayType)
  dayType?: SLADayType;

  @ApiPropertyOptional({ enum: SLAScope, example: 'RIGHTS' })
  @IsOptional()
  @IsEnum(SLAScope)
  scope?: SLAScope;

  @ApiPropertyOptional({ example: ['awaiting_identity_verification', 'on_hold'], description: 'Conditions that pause the SLA clock' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pauseConditions?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoCloseEnabled?: boolean;

  @ApiPropertyOptional({ example: ['notify_admin', 'escalate_to_dpo'], description: 'Actions triggered on SLA breach' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  breachActions?: string[];

  @ApiPropertyOptional({ enum: SLARuleStatus, example: 'SLA_ACTIVE' })
  @IsOptional()
  @IsEnum(SLARuleStatus)
  status?: SLARuleStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
