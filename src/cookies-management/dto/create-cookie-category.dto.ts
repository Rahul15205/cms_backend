import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum CookieCategoryType {
  NECESSARY = 'NECESSARY',
  ANALYTICS = 'ANALYTICS',
  FUNCTIONAL = 'FUNCTIONAL',
  ADVERTISING = 'ADVERTISING',
  UNCATEGORIZED = 'UNCATEGORIZED',
}

export class CreateCookieCategoryDto {
  @IsString()
  name: string;

  @IsEnum(CookieCategoryType)
  category: CookieCategoryType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}
