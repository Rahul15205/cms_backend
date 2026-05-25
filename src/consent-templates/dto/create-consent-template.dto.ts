import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStatus, ConsentType, Regulation, TargetUserCategory, ConsentGivenBy, ConsentMechanism } from '@prisma/client';

export class CreateConsentTemplateDto {
  @ApiProperty({ example: 'Terms of Service v1' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Standard terms of service agreement for end-users.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ConsentType, example: ConsentType.EXPLICIT })
  @IsOptional()
  @IsEnum(ConsentType)
  type?: ConsentType;

  @ApiPropertyOptional({ enum: Regulation, isArray: true, example: [Regulation.GDPR] })
  @IsOptional()
  @IsArray()
  @IsEnum(Regulation, { each: true })
  regulations?: Regulation[];

  @ApiPropertyOptional({ enum: TemplateStatus, example: TemplateStatus.DRAFT })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  noExpiry?: boolean;

  @ApiPropertyOptional({ enum: TargetUserCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TargetUserCategory, { each: true })
  targetUserCategory?: TargetUserCategory[];

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  ageThreshold?: number;

  @ApiPropertyOptional({ enum: ConsentGivenBy })
  @IsOptional()
  @IsEnum(ConsentGivenBy)
  consentGivenBy?: ConsentGivenBy;

  @ApiPropertyOptional({ enum: ConsentMechanism })
  @IsOptional()
  @IsEnum(ConsentMechanism)
  mechanism?: ConsentMechanism;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  separateConsents?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Require OTP before consent is recorded' })
  @IsOptional()
  @IsBoolean()
  requiresOtpVerification?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Require Aadhaar eKYC OTP before consent is recorded' })
  @IsOptional()
  @IsBoolean()
  requiresAadhaarVerification?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  withdrawVisible?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  dataSharing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  privacyNoticeRef?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  auditTrailEnabled?: boolean;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ isArray: true, example: ['en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ example: { questions: [] } })
  @IsOptional()
  @IsObject()
  wizardFields?: Record<string, any>;
}
