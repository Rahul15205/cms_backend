import { PrismaService } from '../prisma/prisma.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceDto } from './dto/update-grievance.dto';
import { CreateGrievanceCommentDto } from './dto/create-grievance-comment.dto';
import { GrievanceStatus } from '@prisma/client';
export declare class GrievancesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateGrievanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        assignedTo: string | null;
        assignedTeam: string | null;
        caseNumber: string;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    findAll(filters: {
        status?: GrievanceStatus;
        category?: string;
        priority?: string;
        assignedTo?: string;
        search?: string;
        tenantId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            _count: {
                comments: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.GrievanceStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string | null;
            userId: string;
            priority: import("@prisma/client").$Enums.GrievancePriority;
            category: import("@prisma/client").$Enums.GrievanceCategory;
            assignedTo: string | null;
            assignedTeam: string | null;
            caseNumber: string;
            subject: string;
            userName: string | null;
            userEmail: string | null;
            resolvedAt: Date | null;
            escalatedAt: Date | null;
        })[];
    }>;
    findOne(id: string): Promise<{
        comments: {
            id: string;
            createdAt: Date;
            content: string;
            createdBy: string;
            grievanceId: string;
        }[];
        _count: {
            comments: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        assignedTo: string | null;
        assignedTeam: string | null;
        caseNumber: string;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    update(id: string, dto: UpdateGrievanceDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        assignedTo: string | null;
        assignedTeam: string | null;
        caseNumber: string;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    addComment(id: string, dto: CreateGrievanceCommentDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        createdBy: string;
        grievanceId: string;
    }>;
    escalate(id: string, userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.GrievanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        userId: string;
        priority: import("@prisma/client").$Enums.GrievancePriority;
        category: import("@prisma/client").$Enums.GrievanceCategory;
        assignedTo: string | null;
        assignedTeam: string | null;
        caseNumber: string;
        subject: string;
        userName: string | null;
        userEmail: string | null;
        resolvedAt: Date | null;
        escalatedAt: Date | null;
    }>;
    getMetrics(): Promise<{
        total: number;
        byStatus: {
            [k: string]: number;
        };
        byCategory: {
            [k: string]: number;
        };
        byPriority: {
            [k: string]: number;
        };
    }>;
}
