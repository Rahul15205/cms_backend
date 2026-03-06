import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessRuleType } from '@prisma/client';

export class CreateAccessRuleDto {
  @ApiProperty({ example: 'Block IPs from non-compliant regions' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: AccessRuleType, example: AccessRuleType.IP })
  @IsEnum(AccessRuleType)
  type!: AccessRuleType;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Rule to explicitly block certain IP ranges.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: { ipRange: ['192.168.1.0/24'], action: 'block' } })
  @IsNotEmpty()
  @IsObject()
  conditions!: Record<string, any>;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  priority?: number;


}
