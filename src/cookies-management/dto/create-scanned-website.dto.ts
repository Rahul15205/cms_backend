import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export enum ScanFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum ScanDepth {
  STANDARD = 'STANDARD',
  DEEP = 'DEEP',
}

export class CreateScannedWebsiteDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsEnum(ScanFrequency)
  @IsOptional()
  frequency?: ScanFrequency;

  @IsEnum(ScanDepth)
  @IsOptional()
  depth?: ScanDepth;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  autoCategorize?: boolean;

  @IsBoolean()
  @IsOptional()
  scanBehindLogin?: boolean;
}
