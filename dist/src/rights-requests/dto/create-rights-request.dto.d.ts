import { RightsRequestType, RightsRequestPriority, SubmissionChannel, Regulation } from '@prisma/client';
export declare class CreateRightsRequestDto {
    type: RightsRequestType;
    regulation: Regulation;
    priority?: RightsRequestPriority;
    requesterId: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    aadhaarNumber?: string;
    isAuthorizedRep?: boolean;
    authorizedRepDetails?: any;
    description: string;
    dataCategories?: string[];
    relatedConsents?: string[];
    relatedApplications?: string[];
    submissionChannel?: SubmissionChannel;
    dueDate?: string;
    tenantId?: string;
}
