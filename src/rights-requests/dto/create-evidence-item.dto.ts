import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenceItemDto {
  @ApiPropertyOptional({ example: 'deletion_certificate.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({ example: 'Deletion Cert' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: '1.2 MB' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
