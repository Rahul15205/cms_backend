import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCookieInventoryDto {
  @IsString()
  name: string;

  @IsString()
  domain: string;

  @IsString()
  @IsOptional()
  expiration?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  categoryId: string;
}
