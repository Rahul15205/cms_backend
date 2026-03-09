import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ description: 'Report name', example: 'Monthly Consent Summary' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ReportType, example: 'CONSENT' })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ReportFormat, example: 'CSV', default: 'CSV' })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Filter parameters for the report', example: { startDate: '2026-01-01', endDate: '2026-03-01' } })
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tenantId?: string;
}
