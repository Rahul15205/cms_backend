import { ConsentDeploymentsService } from './consent-deployments.service';
import { CreateConsentDeploymentDto } from './dto/create-consent-deployment.dto';
import { UpdateConsentDeploymentDto } from './dto/update-consent-deployment.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
export declare class ConsentDeploymentsController {
    private readonly consentDeploymentsService;
    constructor(consentDeploymentsService: ConsentDeploymentsService);
    create(createConsentDeploymentDto: CreateConsentDeploymentDto, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
    findAll(applicationId?: string, versionId?: string, limit?: number, offset?: number): Promise<PaginatedResponseDto<{
        application: {
            name: string;
        };
        version: {
            versionNumber: number;
            templateId: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>>;
    findOne(id: string): Promise<{
        application: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string;
            apiKey: string;
        };
        version: {
            template: {
                title: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ConsentVersionStatus;
            createdAt: Date;
            content: string;
            versionNumber: number;
            changeSummary: string | null;
            changedFields: string[];
            changeReason: string | null;
            approvedBy: string | null;
            approvalTimestamp: Date | null;
            effectiveFrom: Date | null;
            effectiveTo: Date | null;
            usersImpacted: number;
            reconsentTriggered: boolean;
            publishedAt: Date;
            templateId: string;
            publishedBy: string;
        };
        logs: {
            id: string;
            status: import("@prisma/client").$Enums.DeploymentLogStatus;
            action: string;
            details: string | null;
            timestamp: Date;
            deploymentId: string;
            performedBy: string;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
    getLogs(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentLogStatus;
        action: string;
        details: string | null;
        timestamp: Date;
        deploymentId: string;
        performedBy: string;
    }[]>;
    update(id: string, updateConsentDeploymentDto: UpdateConsentDeploymentDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
    rollback(id: string, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentStatus;
        approvedBy: string | null;
        versionId: string;
        applicationId: string;
        deploymentMode: import("@prisma/client").$Enums.DeploymentMode;
        activationDate: Date | null;
        region: string | null;
        platform: string[];
        userSegment: string | null;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
}
