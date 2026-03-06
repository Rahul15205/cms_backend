import { ApiProperty } from '@nestjs/swagger';
import { ConsentTemplateResponseDto } from '../../consent-templates/dto/consent-template-response.dto';

export class ConsentVersionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() versionNumber!: number;
  @ApiProperty() content!: string;
  @ApiProperty() templateId!: string;
  @ApiProperty() publishedBy!: string;
  @ApiProperty() publishedAt!: Date;
  @ApiProperty({ type: () => ConsentTemplateResponseDto, required: false })
  template?: ConsentTemplateResponseDto;
}
