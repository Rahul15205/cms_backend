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
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            name: string;
            description: string | null;
            required: boolean;
        } | null;
    } & {
        id: string;
        title: string;
        content: string | null;
        currentVersion: number;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        typeId: string | null;
        tenantId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(status?: NoticeStatus, typeId?: string, tenantId?: string, search?: string, limit?: number, offset?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        data: ({
            type: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string | null;
                name: string;
                description: string | null;
                required: boolean;
            } | null;
            _count: {
                versions: number;
                acknowledgements: number;
            };
        } & {
            id: string;
            title: string;
            content: string | null;
            currentVersion: number;
            status: import("@prisma/client").$Enums.NoticeStatus;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
            typeId: string | null;
            tenantId: string | null;
        })[];
    }>;
    getLanguages(tenantId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        name: string;
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
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        name: string;
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
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        name: string;
        description: string | null;
        required: boolean;
    })[]>;
    createType(dto: CreateNoticeTypeDto): import("@prisma/client").Prisma.Prisma__NoticeTypeClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        name: string;
        description: string | null;
        required: boolean;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getGlobalHistory(): Promise<{
        id: string;
        title: string;
        content: string | null;
        createdAt: Date;
        noticeId: string;
        version: number;
        changes: string | null;
        author: string | null;
    }[]>;
    findOne(id: string): Promise<{
        type: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            name: string;
            description: string | null;
            required: boolean;
        } | null;
        versions: {
            id: string;
            title: string;
            content: string | null;
            createdAt: Date;
            noticeId: string;
            version: number;
            changes: string | null;
            author: string | null;
        }[];
        _count: {
            acknowledgements: number;
        };
    } & {
        id: string;
        title: string;
        content: string | null;
        currentVersion: number;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        typeId: string | null;
        tenantId: string | null;
    }>;
    update(id: string, dto: UpdateNoticeDto, req: any): Promise<{
        type: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            name: string;
            description: string | null;
            required: boolean;
        } | null;
    } & {
        id: string;
        title: string;
        content: string | null;
        currentVersion: number;
        status: import("@prisma/client").$Enums.NoticeStatus;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        typeId: string | null;
        tenantId: string | null;
    }>;
    getHistory(id: string): Promise<{
        id: string;
        title: string;
        content: string | null;
        createdAt: Date;
        noticeId: string;
        version: number;
        changes: string | null;
        author: string | null;
    }[]>;
}
