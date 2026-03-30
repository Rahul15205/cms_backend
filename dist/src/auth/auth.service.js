"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const otplib_1 = require("otplib");
const qrcode = __importStar(require("qrcode"));
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const encryption_service_1 = require("../encryption/encryption.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    auditLogsService;
    encryptionService;
    constructor(prisma, jwtService, auditLogsService, encryptionService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.auditLogsService = auditLogsService;
        this.encryptionService = encryptionService;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const emailHash = this.encryptionService.generateHash(email);
        const user = await this.prisma.user.findUnique({
            where: { emailHash },
            include: {
                roles: { include: { role: { include: { permissions: true } } } },
                tenant: true
            }
        });
        if (!user) {
            await this.auditLogsService.create({
                action: 'Failed Login: User Not Found',
                category: 'SECURITY',
                severity: 'WARNING',
                details: { email },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            await this.auditLogsService.create({
                userId: user.id,
                action: 'Failed Login: Inactive User',
                category: 'SECURITY',
                severity: 'WARNING',
                tenantId: user.tenantId,
                details: { status: user.status }
            });
            throw new common_1.UnauthorizedException('User account is not active');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await this.auditLogsService.create({
                userId: user.id,
                action: 'Failed Login: Invalid Password',
                category: 'SECURITY',
                severity: 'WARNING',
                tenantId: user.tenantId,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.mfaEnabled) {
            if (!loginDto.mfaToken) {
                return { mfaRequired: true, message: 'MFA token required' };
            }
            const secret = user.mfaSecret ? this.encryptionService.decrypt(user.mfaSecret) : null;
            if (!secret)
                throw new common_1.UnauthorizedException('MFA setup is incomplete');
            const isValid = otplib_1.authenticator.verify({ token: loginDto.mfaToken, secret });
            if (!isValid) {
                await this.auditLogsService.create({
                    userId: user.id,
                    action: 'Failed Login: Invalid MFA Token',
                    category: 'SECURITY',
                    severity: 'WARNING',
                    tenantId: user.tenantId,
                });
                throw new common_1.UnauthorizedException('Invalid MFA token');
            }
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        await this.auditLogsService.create({
            userId: user.id,
            action: 'Successful Login',
            category: 'SECURITY',
            severity: 'INFO',
            tenantId: user.tenantId,
        });
        const maxSessions = 3;
        const activeSessions = await this.prisma.session.findMany({
            where: { userId: user.id, isCurrentSession: true },
            orderBy: { loginTime: 'asc' },
        });
        if (activeSessions.length >= maxSessions) {
            const sessionsToInvalidate = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
            const sessionIds = sessionsToInvalidate.map(s => s.id);
            if (sessionIds.length > 0) {
                await this.prisma.session.updateMany({
                    where: { id: { in: sessionIds } },
                    data: { isCurrentSession: false, refreshToken: null },
                });
                await this.auditLogsService.create({
                    userId: user.id,
                    action: 'Session Limit Exceeded: Oldest Session Terminated automatically',
                    category: 'SECURITY',
                    severity: 'WARNING',
                    tenantId: user.tenantId,
                });
            }
        }
        const refreshToken = crypto.randomUUID();
        await this.prisma.session.create({
            data: {
                userId: user.id,
                loginTime: new Date(),
                lastActivity: new Date(),
                isCurrentSession: true,
                refreshToken,
            }
        });
        const decryptedEmail = this.encryptionService.decrypt(user.email);
        const payload = {
            sub: user.id,
            email: decryptedEmail,
            tenantId: user.tenantId
        };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: decryptedEmail,
                roles: user.roles.map(ur => ur.role.name),
                permissions: user.roles.reduce((acc, ur) => {
                    ur.role.permissions.forEach(p => {
                        acc[p.module] = {
                            view: p.view || acc[p.module]?.view,
                            create: p.create || acc[p.module]?.create,
                            edit: p.edit || acc[p.module]?.edit,
                            approve: p.approve || acc[p.module]?.approve,
                            export: p.export || acc[p.module]?.export,
                            configure: p.configure || acc[p.module]?.configure,
                            admin: p.admin || acc[p.module]?.admin,
                        };
                    });
                    return acc;
                }, {}),
                tenant: user.tenant.name
            }
        };
    }
    async generateMfaSecret(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const email = this.encryptionService.decrypt(user.email);
        const secret = otplib_1.authenticator.generateSecret();
        const otpauthUrl = otplib_1.authenticator.keyuri(email, 'Proteccio CMS', secret);
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: this.encryptionService.encrypt(secret) },
        });
        const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
        return { secret, qrCodeUrl };
    }
    async verifyAndEnableMfa(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaSecret)
            throw new common_1.UnauthorizedException('MFA not setup');
        const secret = this.encryptionService.decrypt(user.mfaSecret);
        const isValid = otplib_1.authenticator.verify({ token, secret });
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid MFA token');
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });
        return { message: 'MFA enabled successfully' };
    }
    async refresh(refreshDto) {
        const { refreshToken } = refreshDto;
        const session = await this.prisma.session.findUnique({
            where: { refreshToken },
            include: {
                user: {
                    include: {
                        roles: { include: { role: { include: { permissions: true } } } },
                        tenant: true
                    }
                }
            }
        });
        if (!session || !session.isCurrentSession) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (session.user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('User account is not active');
        }
        const newRefreshToken = crypto.randomUUID();
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: newRefreshToken,
                lastActivity: new Date()
            }
        });
        const decryptedEmail = this.encryptionService.decrypt(session.user.email);
        const payload = {
            sub: session.user.id,
            email: decryptedEmail,
            tenantId: session.user.tenantId
        };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: newRefreshToken,
            user: {
                id: session.user.id,
                name: session.user.name,
                email: decryptedEmail,
                roles: session.user.roles.map(ur => ur.role.name),
                permissions: session.user.roles.reduce((acc, ur) => {
                    ur.role.permissions.forEach(p => {
                        acc[p.module] = {
                            view: p.view || acc[p.module]?.view,
                            create: p.create || acc[p.module]?.create,
                            edit: p.edit || acc[p.module]?.edit,
                            approve: p.approve || acc[p.module]?.approve,
                            export: p.export || acc[p.module]?.export,
                            configure: p.configure || acc[p.module]?.configure,
                            admin: p.admin || acc[p.module]?.admin,
                        };
                    });
                    return acc;
                }, {}),
                tenant: session.user.tenant.name
            }
        };
    }
    async logout(userId) {
        await this.prisma.session.updateMany({
            where: { userId, isCurrentSession: true },
            data: { isCurrentSession: false, refreshToken: null },
        });
        return { message: 'Logged out successfully. All sessions invalidated.' };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: { include: { role: { include: { permissions: true } } } },
                tenant: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            name: user.name,
            email: this.encryptionService.decrypt(user.email),
            phone: user.phone ? this.encryptionService.decrypt(user.phone) : null,
            status: user.status,
            accountType: user.accountType,
            department: user.department,
            mfaEnabled: user.mfaEnabled,
            aadhaarVerified: user.aadhaarVerified,
            lastLogin: user.lastLogin,
            roles: user.roles.map((ur) => ur.role.name),
            permissions: user.roles.reduce((acc, ur) => {
                ur.role.permissions.forEach((p) => {
                    acc[p.module] = {
                        view: p.view || acc[p.module]?.view,
                        create: p.create || acc[p.module]?.create,
                        edit: p.edit || acc[p.module]?.edit,
                        approve: p.approve || acc[p.module]?.approve,
                        export: p.export || acc[p.module]?.export,
                        configure: p.configure || acc[p.module]?.configure,
                        admin: p.admin || acc[p.module]?.admin,
                    };
                });
                return acc;
            }, {}),
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        audit_logs_service_1.AuditLogsService,
        encryption_service_1.EncryptionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map