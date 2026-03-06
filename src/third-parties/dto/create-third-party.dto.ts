import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ThirdPartyRole } from '@prisma/client';

export class CreateThirdPartyDto {
  @ApiProperty({ description: 'Name of the third party' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ThirdPartyRole, description: 'Role of the third party (e.g., DATA_PROCESSOR)' })
  @IsEnum(ThirdPartyRole)
  @IsNotEmpty()
  role: ThirdPartyRole;

  @ApiProperty({ description: 'Purpose for data sharing' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ description: 'Country of the third party' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ description: 'Indicates if data transfer across borders is involved', default: false })
  @IsBoolean()
  @IsOptional()
  crossBorderTransfer?: boolean;

  @ApiProperty({ description: 'UUID of the associated ConsentTemplate' })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}
