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
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
        deployedAt: Date;
    }>;
    findAll(applicationId?: string, versionId?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
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
        })[];
    }>;
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
            templateId: string;
            changeSummary: string | null;
            changedFields: string[];
            changeReason: string | null;
            effectiveFrom: Date | null;
            effectiveTo: Date | null;
            reconsentTriggered: boolean;
            approvedBy: string | null;
            approvalTimestamp: Date | null;
            usersImpacted: number;
            publishedAt: Date;
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
        approvalRequired: boolean;
        rollbackAllowed: boolean;
        rollbackConditions: string | null;
        lockedAfterActivation: boolean;
        isActive: boolean;
        deployedBy: string | null;
        affectedUsers: number;
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
