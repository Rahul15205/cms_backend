import { GrievancesService } from './grievances.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceDto } from './dto/update-grievance.dto';
import { CreateGrievanceCommentDto } from './dto/create-grievance-comment.dto';
import { GrievanceStatus } from '@prisma/client';
export declare class GrievancesController {
    private readonly grievancesService;
    constructor(grievancesService: GrievancesService);
    create(dto: CreateGrievanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        caseNumber: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        nearBreachAlertSent: boolean;
        slaAlertSent: boolean;
        assignedTo: string | null;
        assignedTeam: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        userEmailHash: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    findAll(status?: GrievanceStatus, category?: string, priority?: string, assignedTo?: string, search?: string, tenantId?: string, limit?: number, offset?: number): Promise<import("../common/dto/paginated-response.dto").PaginatedResponseDto<any>>;
    getMetrics(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        escalated: number;
        trendData: {
            name: string;
            cases: number;
        }[];
        avgResolutionDays: number;
        resolutionTimeDistribution: {
            name: string;
            value: number;
            color: string;
        }[];
        byCategory: {
            [k: string]: number;
        };
        byPriority: {
            [k: string]: number;
        };
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateGrievanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        caseNumber: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        nearBreachAlertSent: boolean;
        slaAlertSent: boolean;
        assignedTo: string | null;
        assignedTeam: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        userEmailHash: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    addComment(id: string, dto: CreateGrievanceCommentDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        createdBy: string;
        content: string;
        grievanceId: string;
    }>;
    escalate(id: string, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        caseNumber: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        nearBreachAlertSent: boolean;
        slaAlertSent: boolean;
        assignedTo: string | null;
        assignedTeam: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        userEmailHash: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
}
