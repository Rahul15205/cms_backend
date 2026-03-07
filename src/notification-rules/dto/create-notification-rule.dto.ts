import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, RecipientType, NotificationFrequency, ConfigRuleStatus } from '@prisma/client';

export class CreateNotificationRuleDto {
  @ApiProperty({ example: 'Rights Request Created Notification' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'rights_request_created', description: 'Event that triggers this notification' })
  @IsNotEmpty()
  @IsString()
  triggerEvent!: string;

  @ApiPropertyOptional({ enum: NotificationChannel, example: 'EMAIL' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: RecipientType, example: 'NOTIF_ROLE' })
  @IsOptional()
  @IsEnum(RecipientType)
  recipientType?: RecipientType;

  @ApiPropertyOptional({ example: 'rights-request-created-template', description: 'Template ID or inline template content' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: NotificationFrequency, example: 'IMMEDIATE' })
  @IsOptional()
  @IsEnum(NotificationFrequency)
  frequency?: NotificationFrequency;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  retryEnabled?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxRetries?: number;

  @ApiPropertyOptional({ enum: ConfigRuleStatus, example: 'CFG_ACTIVE' })
  @IsOptional()
  @IsEnum(ConfigRuleStatus)
  status?: ConfigRuleStatus;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
