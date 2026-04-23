import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum BannerPosition {
  BOTTOM = 'BOTTOM',
  TOP = 'TOP',
  CENTER = 'CENTER',
  CORNER = 'CORNER',
}

export enum BannerStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
}

export class CreateCookieBannerDto {
  @IsString()
  name: string;

  @IsString()
  theme: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;

  @IsEnum(BannerStatus)
  @IsOptional()
  status?: BannerStatus;

  @IsString()
  @IsOptional()
  heading?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  themeColor?: string;

  @IsString()
  @IsOptional()
  websiteId?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsString()
  @IsOptional()
  buttonTextColor?: string;

  @IsNumber()
  @IsOptional()
  borderRadius?: number;

  @IsNumber()
  @IsOptional()
  maxWidth?: number;

  @IsNumber()
  @IsOptional()
  fontSize?: number;

  @IsNumber()
  @IsOptional()
  padding?: number;

  @IsNumber()
  @IsOptional()
  backdropBlur?: number;

  @IsNumber()
  @IsOptional()
  backdropOpacity?: number;
}
