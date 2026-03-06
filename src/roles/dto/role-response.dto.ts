import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleStatus } from '@prisma/client';
import { PermissionDto } from './create-role.dto';

export class RoleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() isSystemRole!: boolean;
  @ApiProperty({ enum: RoleStatus }) status!: RoleStatus;
  @ApiPropertyOptional() tenantId?: string;
  @ApiProperty() isTemporary!: boolean;
  @ApiPropertyOptional() clonedFrom?: string;
  @ApiPropertyOptional() expiresAt?: Date;
  @ApiProperty() createdAt!: Date;
  
  @ApiProperty({ type: [PermissionDto], required: false })
  permissions?: PermissionDto[];
}
