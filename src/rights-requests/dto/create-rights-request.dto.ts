import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RightsRequestType, RightsRequestPriority, SubmissionChannel, Regulation } from '@prisma/client';

export class CreateRightsRequestDto {
  @ApiProperty({ enum: RightsRequestType })
  @IsNotEmpty()
  @IsEnum(RightsRequestType)
  type!: RightsRequestType;

  @ApiProperty({ enum: Regulation })
  @IsNotEmpty()
  @IsEnum(Regulation)
  regulation!: Regulation;

  @ApiPropertyOptional({ enum: RightsRequestPriority, default: 'NORMAL' })
  @IsOptional()
  @IsEnum(RightsRequestPriority)
  priority?: RightsRequestPriority;

  @ApiProperty({ example: 'REQ-001' })
  @IsNotEmpty()
  @IsString()
  requesterId!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  requesterName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsString()
  requesterEmail!: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAuthorizedRep?: boolean;

  @ApiPropertyOptional({ example: { name: 'Jane Doe', relationship: 'Guardian', proofDocument: 'doc-url' } })
  @IsOptional()
  authorizedRepDetails?: any;

  @ApiProperty({ example: 'I want to access my personal data' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: ['Personal', 'Financial'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dataCategories?: string[];

  @ApiPropertyOptional({ example: ['template-uuid-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedConsents?: string[];

  @ApiPropertyOptional({ example: ['Website', 'Mobile App'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedApplications?: string[];

  @ApiPropertyOptional({ enum: SubmissionChannel, default: 'WEB' })
  @IsOptional()
  @IsEnum(SubmissionChannel)
  submissionChannel?: SubmissionChannel;

  @ApiPropertyOptional({ example: '2026-04-05T00:00:00.000Z', description: 'SLA due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
