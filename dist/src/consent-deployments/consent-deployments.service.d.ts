import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDeploymentDto } from './dto/create-consent-deployment.dto';
import { UpdateConsentDeploymentDto } from './dto/update-consent-deployment.dto';
export declare class ConsentDeploymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createConsentDeploymentDto: CreateConsentDeploymentDto, deployedBy?: string): Promise<{
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedAt: Date;
    }>;
    findAll(applicationId?: string, versionId?: string, limit?: number, offset?: number): Promise<import("../common/dto/paginated-response.dto").PaginatedResponseDto<{
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedAt: Date;
    }>;
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedAt: Date;
    }>;
    rollback(id: string, performedBy: string): Promise<{
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedAt: Date;
    }>;
    getDeploymentLogs(deploymentId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.DeploymentLogStatus;
        action: string;
        details: string | null;
        timestamp: Date;
        deploymentId: string;
        performedBy: string;
    }[]>;
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
        deployedBy: string | null;
        affectedUsers: number;
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedAt: Date;
    }>;
}
