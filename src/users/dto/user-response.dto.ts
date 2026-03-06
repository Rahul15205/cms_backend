import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, AccountType } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty({ enum: UserStatus }) status!: UserStatus;
  @ApiProperty({ enum: AccountType }) accountType!: AccountType;
  @ApiPropertyOptional() department?: string;
  @ApiProperty() mfaEnabled!: boolean;
  @ApiPropertyOptional() lastLogin?: Date;
  @ApiPropertyOptional() validFrom?: Date;
  @ApiPropertyOptional() validUntil?: Date;
  @ApiProperty() tenantId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
