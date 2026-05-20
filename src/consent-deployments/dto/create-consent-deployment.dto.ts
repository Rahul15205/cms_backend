import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsNumber, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeploymentMode, DeploymentStatus } from '@prisma/client';

export class CreateConsentDeploymentDto {
  @ApiProperty({ example: 'uuid-of-consent-version' })
  @IsNotEmpty()
  @IsString()
  versionId!: string;

  @ApiProperty({ example: 'uuid-of-application' })
  @IsNotEmpty()
  @IsString()
  applicationId!: string;

  @ApiPropertyOptional({ enum: DeploymentMode, default: 'MANUAL' })
  @IsOptional()
  @IsEnum(DeploymentMode)
  deploymentMode?: DeploymentMode;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  activationDate?: string;

  @ApiPropertyOptional({ example: 'India, UAE' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: ['Web', 'Mobile'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platform?: string[];

  @ApiPropertyOptional({ example: 'All Users' })
  @IsOptional()
  @IsString()
  userSegment?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  rollbackAllowed?: boolean;

  @ApiPropertyOptional({ example: 'Rollback if error rate > 5%' })
  @IsOptional()
  @IsString()
  rollbackConditions?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  lockedAfterActivation?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether this deployment is actively serving users' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: DeploymentStatus, description: 'Deployment status override (for updates)' })
  @IsOptional()
  @IsEnum(DeploymentStatus)
  status?: DeploymentStatus;
}
