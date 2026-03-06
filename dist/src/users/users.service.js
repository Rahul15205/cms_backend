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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto, tenantId) {
        const { roles, password, ...userData } = createUserDto;
        const existing = await this.prisma.user.findUnique({ where: { email: userData.email } });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                ...userData,
                tenantId,
                password: hashedPassword,
                roles: {
                    create: roles.map(roleId => ({ roleId }))
                }
            },
            include: { roles: true }
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.tenantId)
            where.tenantId = filters.tenantId;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const take = filters?.limit ? Number(filters.limit) : 50;
        const skip = filters?.offset ? Number(filters.offset) : 0;
        const orderBy = filters?.sortBy ? { [filters.sortBy]: filters.sortOrder || 'desc' } : { createdAt: 'desc' };
        const [total, data] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                take,
                skip,
                orderBy,
                select: {
                    id: true, email: true, name: true, phone: true, status: true, accountType: true,
                    department: true, mfaEnabled: true, lastLogin: true, validFrom: true,
                    validUntil: true, tenantId: true, createdAt: true, updatedAt: true,
                    roles: { include: { role: { select: { name: true } } } }
                }
            })
        ]);
        return {
            total,
            page: Math.floor(skip / take) + 1,
            limit: take,
            data
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                tenant: true,
                roles: { include: { role: { include: { permissions: true } } } }
            }
        });
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        return user;
    }
    async update(id, updateUserDto) {
        const { roles, password, ...data } = updateUserDto;
        await this.findOne(id);
        const updateData = { ...data };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        if (roles) {
            await this.prisma.userRole.deleteMany({ where: { userId: id } });
            updateData.roles = {
                create: roles.map(roleId => ({ roleId }))
            };
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, status: true }
        });
    }
    async updateStatus(id, status) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, status: true }
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: { status: client_1.UserStatus.DISABLED }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map