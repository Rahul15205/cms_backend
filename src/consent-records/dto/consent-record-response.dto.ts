import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentStatus } from '@prisma/client';

export class ConsentRecordResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() versionId!: string;
  @ApiProperty() applicationId!: string;
  @ApiPropertyOptional() userId?: string;
  @ApiPropertyOptional() endUserEmail?: string;
  @ApiPropertyOptional() endUserIp?: string;
  @ApiProperty({ enum: ConsentStatus }) status!: ConsentStatus;
  @ApiProperty() grantedAt!: Date;
  @ApiPropertyOptional() revokedAt?: Date;
  @ApiPropertyOptional() metadata?: Record<string, any>;
}
