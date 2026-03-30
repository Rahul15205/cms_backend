import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    create(createInvitationDto: CreateInvitationDto, req: any): Promise<{
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
