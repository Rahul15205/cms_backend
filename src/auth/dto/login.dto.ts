import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@cms.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Consent@2024' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
