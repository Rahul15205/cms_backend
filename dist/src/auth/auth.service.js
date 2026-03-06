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
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                roles: { include: { role: { include: { permissions: true } } } },
                tenant: true
            }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('User account is not active');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
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
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId
        };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
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
        const payload = {
            sub: session.user.id,
            email: session.user.email,
            tenantId: session.user.tenantId
        };
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: newRefreshToken,
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map