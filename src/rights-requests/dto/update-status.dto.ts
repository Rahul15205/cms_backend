import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RightsRequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({ enum: RightsRequestStatus })
  @IsNotEmpty()
  @IsEnum(RightsRequestStatus)
  status!: RightsRequestStatus;

  @ApiPropertyOptional({ example: 'Identity verified via OTP' })
  @IsOptional()
  @IsString()
  note?: string;
}
