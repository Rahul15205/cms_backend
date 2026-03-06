import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, ValidateNested, IsUUID, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleStatus, ModuleName } from '@prisma/client';

export class PermissionDto {
  @ApiProperty({ enum: ModuleName })
  @IsEnum(ModuleName)
  module!: ModuleName;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  view?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  edit?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  approve?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  export?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  configure?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  admin?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Auditor' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Read-only access to all modules' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @ApiProperty({ enum: RoleStatus, example: RoleStatus.ACTIVE })
  @IsEnum(RoleStatus)
  status!: RoleStatus;



  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiProperty({ type: [PermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];
}
