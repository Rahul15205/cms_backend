import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MfaTokenDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  token!: string;
}
