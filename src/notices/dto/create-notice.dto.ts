import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoticeStatus } from '@prisma/client';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Privacy Policy' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: '<h1>Privacy Policy</h1><p>This notice explains...</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: NoticeStatus, example: 'NOTICE_DRAFT' })
  @IsOptional()
  @IsEnum(NoticeStatus)
  status?: NoticeStatus;

  @ApiPropertyOptional({ description: 'FK to NoticeType' })
  @IsOptional()
  @IsString()
  typeId?: string;

  @ApiPropertyOptional({ description: 'Tenant ID for multi-tenant scoping' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
