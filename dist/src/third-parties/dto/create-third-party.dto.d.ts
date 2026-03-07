import { ThirdPartyRole } from '@prisma/client';
export declare class CreateThirdPartyDto {
    name: string;
    role: ThirdPartyRole;
    purpose: string;
    country: string;
    crossBorderTransfer?: boolean;
    templateId: string;
}
