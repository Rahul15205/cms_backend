"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let InvitationsService = class InvitationsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(createInvitationDto, inviterId, tenantId) {
        const { email, roleId } = createInvitationDto;
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const existingInv = await this.prisma.invitation.findFirst({
            where: { email, status: client_1.InvitationStatus.PENDING }
        });
        if (existingInv) {
            throw new common_1.ConflictException('Pending invitation already exists for this email');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const invitation = await this.prisma.invitation.create({
            data: {
                email,
                roleId,
                invitedBy: inviterId,
                tenantId,
                expiresAt,
                status: client_1.InvitationStatus.PENDING
            },
            include: { role: { select: { name: true } }, inviter: { select: { name: true, email: true } } }
        });
        if (invitation.role && invitation.role.name) {
            this.notificationsService.sendInvitationEmail({
                to: invitation.email,
                role: invitation.role.name,
                inviteUrl: `http://localhost:5173/accept-invite?token=${invitation.id}`,
            });
        }
        return invitation;
    }
    findAll(tenantId) {
        const where = tenantId ? { tenantId } : {};
        return this.prisma.invitation.findMany({
            where,
            include: { role: { select: { name: true } }, inviter: { select: { name: true } } },
            orderBy: { invitedAt: 'desc' }
        });
    }
    async resend(id) {
        const inv = await this.prisma.invitation.findUnique({ where: { id } });
        if (!inv)
            throw new common_1.NotFoundException('Invitation not found');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const updatedInv = await this.prisma.invitation.update({
            where: { id },
            data: { expiresAt, status: client_1.InvitationStatus.PENDING },
            include: { role: { select: { name: true } } }
        });
        if (updatedInv.role && updatedInv.role.name) {
            this.notificationsService.sendInvitationEmail({
                to: updatedInv.email,
                role: updatedInv.role.name,
                inviteUrl: `http://localhost:5173/accept-invite?token=${updatedInv.id}`,
            });
        }
        return updatedInv;
    }
    async remove(id) {
        const inv = await this.prisma.invitation.findUnique({ where: { id } });
        if (!inv)
            throw new common_1.NotFoundException('Invitation not found');
        return this.prisma.invitation.delete({ where: { id } });
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map