import { PartialType } from '@nestjs/swagger';
import { CreateConsentRecordDto } from './create-consent-record.dto';

export class UpdateConsentRecordDto extends PartialType(CreateConsentRecordDto) {}
