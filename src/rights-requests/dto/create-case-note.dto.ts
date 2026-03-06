import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaseNoteType } from '@prisma/client';

export class CreateCaseNoteDto {
  @ApiPropertyOptional({ enum: CaseNoteType, default: 'NOTE_INTERNAL' })
  @IsOptional()
  @IsEnum(CaseNoteType)
  type?: CaseNoteType;

  @ApiProperty({ example: 'Contacted requester for additional documentation' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: ['https://storage.example.com/doc1.pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
