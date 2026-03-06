import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenceItemDto {
  @ApiProperty({ example: 'deletion_certificate.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'pdf' })
  @IsNotEmpty()
  @IsString()
  fileType!: string;

  @ApiProperty({ example: 'Deletion Cert' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiProperty({ example: '1.2 MB' })
  @IsNotEmpty()
  @IsString()
  size!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
