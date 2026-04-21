import { IsString, IsEnum, IsOptional } from 'class-validator';

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
}
