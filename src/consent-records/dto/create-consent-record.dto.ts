import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentStatus } from '@prisma/client';

export class CreateConsentRecordDto {
  @ApiProperty({ example: 'uuid-version-id' })
  @IsNotEmpty()
  @IsString()
  versionId!: string;

  @ApiProperty({ example: 'uuid-application-id' })
  @IsNotEmpty()
  @IsString()
  applicationId!: string;

  @ApiPropertyOptional({ example: 'uuid-user-id', description: 'Internal platform user ID if known' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'anonymous@example.com', description: 'Email address if tracking external anonymous user' })
  @IsOptional()
  @IsString()
  endUserEmail?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number if tracking external anonymous user' })
  @IsOptional()
  @IsString()
  endUserPhone?: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  endUserIp?: string;

  @ApiPropertyOptional({ enum: ConsentStatus, default: ConsentStatus.GRANTED })
  @IsOptional()
  @IsEnum(ConsentStatus)
  status?: ConsentStatus;

  @ApiPropertyOptional({ example: { deviceAgent: 'Mozilla/5.0...' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
