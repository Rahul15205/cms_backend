import { DeploymentMode } from '@prisma/client';
export declare class CreateConsentDeploymentDto {
    versionId: string;
    applicationId: string;
    deploymentMode?: DeploymentMode;
    activationDate?: string;
    region?: string;
    platform?: string[];
    userSegment?: string;
    approvalRequired?: boolean;
    rollbackAllowed?: boolean;
    rollbackConditions?: string;
    lockedAfterActivation?: boolean;
    isActive?: boolean;
}
