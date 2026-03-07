import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { CreateNoticeTypeDto } from './dto/create-notice-type.dto';
import { NoticeStatus } from '@prisma/client';
export declare class NoticesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateNoticeDto, userId?: string): import("@prisma/client").Prisma.Prisma__NoticeClient<{
        type: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string | null;
            required: boolean;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        title: string;
        content: string | null;
        createdBy: string | null;
        typeId: string | null;
        currentVersion: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(filters: {
        status?: NoticeStatus;
        typeId?: string;
        tenantId?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            type: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                tenantId: string | null;
                required: boolean;
            } | null;
            _count: {
                versions: number;
                acknowledgements: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.NoticeStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            title: string;
            content: string | null;
            createdBy: string | null;
            typeId: string | null;
            currentVersion: number;
        })[];
    }>;
    findOne(id: string): Promise<{
        type: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string | null;
            required: boolean;
        } | null;
        _count: {
            acknowledgements: number;
        };
        versions: {
            id: string;
            createdAt: Date;
            title: string;
            content: string | null;
            version: number;
            changes: string | null;
            author: string | null;
            noticeId: string;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        title: string;
        content: string | null;
        createdBy: string | null;
        typeId: string | null;
        currentVersion: number;
    }>;
    update(id: string, dto: UpdateNoticeDto, userId?: string): Promise<{
        type: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string | null;
            required: boolean;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        title: string;
        content: string | null;
        createdBy: string | null;
        typeId: string | null;
        currentVersion: number;
    }>;
    getHistory(noticeId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string | null;
        version: number;
        changes: string | null;
        author: string | null;
        noticeId: string;
    }[]>;
    getLanguages(tenantId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        code: string;
        isDefault: boolean;
        completion: number;
    }[]>;
    createType(dto: CreateNoticeTypeDto): import("@prisma/client").Prisma.Prisma__NoticeTypeClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        required: boolean;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getTypes(tenantId?: string): Promise<({
        _count: {
            notices: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        required: boolean;
    })[]>;
}
