import { PartialType } from '@nestjs/swagger';
import { CreateConsentDeploymentDto } from './create-consent-deployment.dto';

export class UpdateConsentDeploymentDto extends PartialType(CreateConsentDeploymentDto) {}
