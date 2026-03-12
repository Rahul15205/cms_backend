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
        caseNumber: string;
        subject: string;
        description: string | null;
        userId: string;
        userName: string | null;
        userEmail: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        assignedTo: string | null;
        assignedTeam: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
        tenantId: string | null;
    }>;
    findAll(status?: GrievanceStatus, category?: string, priority?: string, assignedTo?: string, search?: string, tenantId?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            _count: {
                comments: number;
            };
        } & {
            id: string;
            caseNumber: string;
            subject: string;
            description: string | null;
            userId: string;
            userName: string | null;
            userEmail: string | null;
            category: import("@prisma/client").$Enums.GrievanceCategory;
            priority: import("@prisma/client").$Enums.GrievancePriority;
            status: import("@prisma/client").$Enums.GrievanceStatus;
            assignedTo: string | null;
            assignedTeam: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
            escalatedAt: Date | null;
            tenantId: string | null;
        })[];
    }>;
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
    findOne(id: string): Promise<{
        comments: {
            id: string;
            createdAt: Date;
            grievanceId: string;
            content: string;
            createdBy: string;
        }[];
        _count: {
            comments: number;
        };
    } & {
        id: string;
        caseNumber: string;
        subject: string;
        description: string | null;
        userId: string;
        userName: string | null;
        userEmail: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        assignedTo: string | null;
        assignedTeam: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
        tenantId: string | null;
    }>;
    update(id: string, dto: UpdateGrievanceDto): Promise<{
        id: string;
        caseNumber: string;
        subject: string;
        description: string | null;
        userId: string;
        userName: string | null;
        userEmail: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        assignedTo: string | null;
        assignedTeam: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
        tenantId: string | null;
    }>;
    addComment(id: string, dto: CreateGrievanceCommentDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        grievanceId: string;
        content: string;
        createdBy: string;
    }>;
    escalate(id: string, req: any): Promise<{
        id: string;
        caseNumber: string;
        subject: string;
        description: string | null;
        userId: string;
        userName: string | null;
        userEmail: string | null;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        assignedTo: string | null;
        assignedTeam: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
        tenantId: string | null;
    }>;
}
