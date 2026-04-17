import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createApplicationDto: CreateApplicationDto, tenantId: string): import("@prisma/client").Prisma.Prisma__ApplicationClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(tenantId?: string, search?: string, limit?: number, offset?: number): Promise<import("../common/dto/paginated-response.dto").PaginatedResponseDto<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }>>;
    findOne(id: string): Promise<{
        deployments: ({
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
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }>;
    update(id: string, updateApplicationDto: UpdateApplicationDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }>;
    rollApiKey(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }>;
}
