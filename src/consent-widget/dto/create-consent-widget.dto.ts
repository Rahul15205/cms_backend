import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetDisplayMode, WidgetTrigger } from '@prisma/client';

export class CreateConsentWidgetDto {
  @ApiProperty({ example: 'Registration Consent Form' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'uuid-of-application' })
  @IsNotEmpty()
  @IsString()
  applicationId!: string;

  @ApiProperty({ example: 'uuid-of-consent-template' })
  @IsNotEmpty()
  @IsString()
  templateId!: string;

  // Display Settings
  @ApiPropertyOptional({ enum: WidgetDisplayMode, default: 'POPUP' })
  @IsOptional()
  @IsEnum(WidgetDisplayMode)
  displayMode?: WidgetDisplayMode;

  @ApiPropertyOptional({ enum: WidgetTrigger, default: 'MANUAL' })
  @IsOptional()
  @IsEnum(WidgetTrigger)
  trigger?: WidgetTrigger;

  @ApiPropertyOptional({ example: 'center' })
  @IsOptional()
  @IsString()
  position?: string;

  // Branding
  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsString()
  themeColor?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ example: '#111827' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  buttonTextColor?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  borderRadius?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  fontSize?: number;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  // Content
  @ApiPropertyOptional({ example: 'We value your privacy' })
  @IsOptional()
  @IsString()
  heading?: string;

  @ApiPropertyOptional({ example: 'Please review and consent to the following...' })
  @IsOptional()
  @IsString()
  description?: string;

  // Consent Collection Fields
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  collectName?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  collectEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  collectPhone?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireAllPurposes?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showPrivacyLink?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/privacy' })
  @IsOptional()
  @IsString()
  privacyPolicyUrl?: string;

  // Button Labels
  @ApiPropertyOptional({ example: 'Accept All' })
  @IsOptional()
  @IsString()
  acceptAllText?: string;

  @ApiPropertyOptional({ example: 'Reject All' })
  @IsOptional()
  @IsString()
  rejectAllText?: string;

  @ApiPropertyOptional({ example: 'Save Preferences' })
  @IsOptional()
  @IsString()
  savePrefsText?: string;

  // Multi-language
  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiPropertyOptional({ example: ['en', 'hi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  // Custom CSS
  @ApiPropertyOptional({ example: '.proteccio-widget { font-family: Arial; }' })
  @IsOptional()
  @IsString()
  customCss?: string;
}
