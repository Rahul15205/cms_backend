import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubProcessorDto {
  @ApiProperty({ description: 'Name of the sub-processor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Purpose for data processing' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ description: 'Country of the sub-processor' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ description: 'Information regarding change notification policies' })
  @IsString()
  @IsOptional()
  changeNotification?: string;

  @ApiProperty({ description: 'UUID of the associated ConsentTemplate' })
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}
