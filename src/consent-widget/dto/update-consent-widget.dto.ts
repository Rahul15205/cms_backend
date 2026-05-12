import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetStatus } from '@prisma/client';
import { CreateConsentWidgetDto } from './create-consent-widget.dto';

export class UpdateConsentWidgetDto extends PartialType(CreateConsentWidgetDto) {
  @ApiPropertyOptional({ enum: WidgetStatus })
  @IsOptional()
  @IsEnum(WidgetStatus)
  status?: WidgetStatus;
}
