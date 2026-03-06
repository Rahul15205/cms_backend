import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentCategory } from '@prisma/client';

export class CreateCaseAttachmentDto {
  @ApiProperty({ example: 'identity_proof.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsNotEmpty()
  @IsString()
  fileType!: string;

  @ApiProperty({ example: '2.4 MB' })
  @IsNotEmpty()
  @IsString()
  fileSize!: string;

  @ApiPropertyOptional({ enum: AttachmentCategory, default: 'ATT_OTHER' })
  @IsOptional()
  @IsEnum(AttachmentCategory)
  category?: AttachmentCategory;

  @ApiProperty({ example: 'https://storage.example.com/files/identity_proof.pdf' })
  @IsNotEmpty()
  @IsString()
  url!: string;
}
