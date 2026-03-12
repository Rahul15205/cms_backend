import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { CreateNoticeTypeDto } from './dto/create-notice-type.dto';
import { NoticeStatus } from '@prisma/client';
export declare class NoticesController {
    private readonly noticesService;
    constructor(noticesService: NoticesService);
    create(dto: CreateNoticeDto, req: any): import("@prisma/client").Prisma.Prisma__NoticeClient<{
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
        createdBy: string | null;
        content: string | null;
        typeId: string | null;
        currentVersion: number;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(status?: NoticeStatus, typeId?: string, tenantId?: string, search?: string, limit?: number, offset?: number): Promise<{
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
            createdBy: string | null;
            content: string | null;
            typeId: string | null;
            currentVersion: number;
        })[];
    }>;
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
    createLanguage(dto: {
        code: string;
        name: string;
        isDefault?: boolean;
        tenantId?: string;
    }): import("@prisma/client").Prisma.Prisma__NoticeLanguageClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        code: string;
        isDefault: boolean;
        completion: number;
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
    createType(dto: CreateNoticeTypeDto): import("@prisma/client").Prisma.Prisma__NoticeTypeClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        required: boolean;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getGlobalHistory(): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string | null;
        version: number;
        changes: string | null;
        author: string | null;
        noticeId: string;
    }[]>;
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
        _count: {
            acknowledgements: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        title: string;
        createdBy: string | null;
        content: string | null;
        typeId: string | null;
        currentVersion: number;
    }>;
    update(id: string, dto: UpdateNoticeDto, req: any): Promise<{
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
        createdBy: string | null;
        content: string | null;
        typeId: string | null;
        currentVersion: number;
    }>;
    getHistory(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        content: string | null;
        version: number;
        changes: string | null;
        author: string | null;
        noticeId: string;
    }[]>;
}
