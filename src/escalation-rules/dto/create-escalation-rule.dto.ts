import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EscalationTrigger, EscalationLevel, EscalationAction, ConfigRuleStatus } from '@prisma/client';

export class CreateEscalationRuleDto {
  @ApiProperty({ example: 'SLA Breach Auto-Escalation' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: EscalationTrigger, example: 'SLA_BREACH' })
  @IsOptional()
  @IsEnum(EscalationTrigger)
  triggerCondition?: EscalationTrigger;

  @ApiPropertyOptional({ example: 24, description: 'Threshold value (e.g., hours past SLA, risk score)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  triggerThreshold?: number;

  @ApiPropertyOptional({ enum: EscalationLevel, example: 'L1' })
  @IsOptional()
  @IsEnum(EscalationLevel)
  escalationLevel?: EscalationLevel;

  @ApiProperty({ example: 'DPO', description: 'Role name to escalate to' })
  @IsNotEmpty()
  @IsString()
  recipientRole!: string;

  @ApiPropertyOptional({ description: 'Specific user ID to escalate to (optional)' })
  @IsOptional()
  @IsString()
  recipientUser?: string;

  @ApiPropertyOptional({ enum: EscalationAction, example: 'NOTIFY' })
  @IsOptional()
  @IsEnum(EscalationAction)
  action?: EscalationAction;

  @ApiPropertyOptional({ example: 3, description: 'Maximum escalation levels' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxLevels?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoCloseOnResolution?: boolean;

  @ApiPropertyOptional({ enum: ConfigRuleStatus, example: 'CFG_ACTIVE' })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
