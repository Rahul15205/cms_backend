import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ example: 'uuid-refresh-token' })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
