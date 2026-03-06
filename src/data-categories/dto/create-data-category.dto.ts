import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { DataCategory, DataSource } from '@prisma/client';

export class CreateDataCategoryDto {
  @ApiProperty({ enum: DataCategory, description: 'The category of the data' })
  @IsEnum(DataCategory)
  @IsNotEmpty()
  category: DataCategory;

  @ApiProperty({ description: 'Label or display name for the data category' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Indicates if this data is mandatory', default: true })
  @IsBoolean()
  @IsOptional()
  mandatory?: boolean;

  @ApiPropertyOptional({ enum: DataSource, description: 'Source of the data', default: DataSource.DIRECT })
  @IsEnum(DataSource)
  @IsOptional()
  source?: DataSource;

  @ApiPropertyOptional({ description: 'Detailed description of the data category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Country of origin or processing' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'UUID of the associated ConsentTemplate' })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}
