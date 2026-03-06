import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStatus } from '@prisma/client';

export class ConsentTemplateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: TemplateStatus }) status!: TemplateStatus;
  @ApiPropertyOptional() wizardFields?: Record<string, any>;
  @ApiProperty() tenantId!: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
