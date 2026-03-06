import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PurposeNecessity } from '@prisma/client';

export class CreatePurposeDto {
  @ApiProperty({ description: 'Name of the purpose' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Detailed description of the purpose' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Indicates if this is the primary purpose', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({ enum: PurposeNecessity, description: 'Necessity of the purpose' })
  @IsEnum(PurposeNecessity)
  @IsNotEmpty()
  necessity: PurposeNecessity;

  @ApiPropertyOptional({ description: 'Involves automated processing', default: false })
  @IsBoolean()
  @IsOptional()
  automatedProcessing?: boolean;

  @ApiPropertyOptional({ description: 'Involves profiling usage', default: false })
  @IsBoolean()
  @IsOptional()
  profilingUsage?: boolean;

  @ApiProperty({ description: 'UUID of the associated ConsentTemplate' })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}
