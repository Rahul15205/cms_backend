import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() apiKey!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
