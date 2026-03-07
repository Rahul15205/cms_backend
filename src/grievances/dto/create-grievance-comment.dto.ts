import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGrievanceCommentDto {
  @ApiProperty({ example: 'We are looking into this issue and will respond within 48 hours.' })
  @IsNotEmpty()
  @IsString()
  content!: string;
}
