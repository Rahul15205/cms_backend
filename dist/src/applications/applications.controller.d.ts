import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(createApplicationDto: CreateApplicationDto, req: any): import("@prisma/client").Prisma.Prisma__ApplicationClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string;
        apiKey: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(search?: string, tenantId?: string, limit?: number, offset?: number): Promise<PaginatedResponseDto<{
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
            approvalRequired: boolean;
            rollbackAllowed: boolean;
            rollbackConditions: string | null;
            lockedAfterActivation: boolean;
            isActive: boolean;
            deployedBy: string | null;
            affectedUsers: number;
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
    rollApiKey(id: string): Promise<{
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
}
