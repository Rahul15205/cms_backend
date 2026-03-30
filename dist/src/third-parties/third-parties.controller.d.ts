import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
export declare class ThirdPartiesController {
    private readonly thirdPartiesService;
    constructor(thirdPartiesService: ThirdPartiesService);
    create(createThirdPartyDto: CreateThirdPartyDto): Promise<{
        role: import("@prisma/client").$Enums.ThirdPartyRole;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        crossBorderTransfer: boolean;
    }>;
    findAll(): Promise<{
        role: import("@prisma/client").$Enums.ThirdPartyRole;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        crossBorderTransfer: boolean;
    }[]>;
    findOne(id: string): Promise<{
        template: {
            type: import("@prisma/client").$Enums.ConsentType;
            id: string;
            status: import("@prisma/client").$Enums.TemplateStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            title: string;
            regulations: import("@prisma/client").$Enums.Regulation[];
            wizardFields: import("@prisma/client/runtime/client").JsonValue | null;
            validityStart: Date | null;
            validityEnd: Date | null;
            noExpiry: boolean;
            targetUserCategory: import("@prisma/client").$Enums.TargetUserCategory[];
            ageThreshold: number;
            consentGivenBy: import("@prisma/client").$Enums.ConsentGivenBy;
            mechanism: import("@prisma/client").$Enums.ConsentMechanism;
            separateConsents: boolean;
            withdrawVisible: boolean;
            dataSharing: boolean;
            privacyNoticeRef: string | null;
            auditTrailEnabled: boolean;
            defaultLanguage: string;
            supportedLanguages: string[];
            createdBy: string;
        };
    } & {
        role: import("@prisma/client").$Enums.ThirdPartyRole;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        crossBorderTransfer: boolean;
    }>;
    update(id: string, updateThirdPartyDto: UpdateThirdPartyDto): Promise<{
        role: import("@prisma/client").$Enums.ThirdPartyRole;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        crossBorderTransfer: boolean;
    }>;
    remove(id: string): Promise<{
        role: import("@prisma/client").$Enums.ThirdPartyRole;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        purpose: string;
        templateId: string;
        country: string;
        crossBorderTransfer: boolean;
    }>;
}
