import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum ConsentLogStatus {
  ACCEPTED = 'ACCEPTED',
  WITHDRAWN = 'WITHDRAWN',
}

export class CreateCookieConsentLogDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsEnum(ConsentLogStatus)
  status: ConsentLogStatus;
}
