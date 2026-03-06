import { PartialType } from '@nestjs/swagger';
import { CreateConsentTemplateDto } from './create-consent-template.dto';

export class UpdateConsentTemplateDto extends PartialType(CreateConsentTemplateDto) {}
