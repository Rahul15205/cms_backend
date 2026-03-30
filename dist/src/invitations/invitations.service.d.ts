import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class InvitationsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(createInvitationDto: CreateInvitationDto, inviterId: string, tenantId: string): Promise<{
        role: {
            name: string;
        };
        inviter: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        expiresAt: Date;
        tenantId: string | null;
        roleId: string;
        email: string;
        invitedBy: string;
        invitedAt: Date;
        acceptedAt: Date | null;
    }>;
    findAll(tenantId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        role: {
            name: string;
        };
        inviter: {
            name: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        expiresAt: Date;
        tenantId: string | null;
        roleId: string;
        email: string;
        invitedBy: string;
        invitedAt: Date;
        acceptedAt: Date | null;
    })[]>;
    resend(id: string): Promise<{
        role: {
            name: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        expiresAt: Date;
        tenantId: string | null;
        roleId: string;
        email: string;
        invitedBy: string;
        invitedAt: Date;
        acceptedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        expiresAt: Date;
        tenantId: string | null;
        roleId: string;
        email: string;
        invitedBy: string;
        invitedAt: Date;
        acceptedAt: Date | null;
    }>;
}
