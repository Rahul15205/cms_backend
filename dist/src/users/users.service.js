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
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../encryption/encryption.service");
let UsersService = class UsersService {
    prisma;
    encryptionService;
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    async create(createUserDto, tenantId) {
        const { roles, password, ...userData } = createUserDto;
        const emailHash = this.encryptionService.generateHash(userData.email);
        const existing = await this.prisma.user.findUnique({ where: { emailHash } });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const encryptedEmail = this.encryptionService.encrypt(userData.email);
        const encryptedPhone = userData.phone ? this.encryptionService.encrypt(userData.phone) : null;
        const phoneHash = userData.phone ? this.encryptionService.generateHash(userData.phone) : null;
        const aadhaarRaw = userData.aadhaarNumber;
        const encryptedAadhaar = aadhaarRaw ? this.encryptionService.encrypt(aadhaarRaw) : null;
        const aadhaarHash = aadhaarRaw ? this.encryptionService.generateHash(aadhaarRaw) : null;
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                ...userData,
                email: encryptedEmail,
                emailHash: emailHash,
                phone: encryptedPhone,
                phoneHash: phoneHash,
                aadhaarNumber: encryptedAadhaar,
                aadhaarHash: aadhaarHash,
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
            const searchHash = this.encryptionService.generateHash(filters.search);
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { emailHash: searchHash },
                { phoneHash: searchHash },
                { aadhaarHash: searchHash }
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
        const enrichedData = data.map(u => this.decryptUser(u));
        return (0, paginated_response_dto_1.paginate)(enrichedData, total, Math.floor(skip / take) + 1, take);
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
        return this.decryptUser(user);
    }
    decryptUser(user) {
        if (!user)
            return user;
        return {
            ...user,
            email: this.encryptionService.decrypt(user.email),
            phone: user.phone ? this.encryptionService.decrypt(user.phone) : null,
            aadhaarNumber: user.aadhaarNumber ? this.encryptionService.decrypt(user.aadhaarNumber) : null,
        };
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
                create: roles.map((roleId) => ({ roleId })),
            };
        }
        if (data.email) {
            updateData.email = this.encryptionService.encrypt(data.email);
            updateData.emailHash = this.encryptionService.generateHash(data.email);
        }
        if (data.phone) {
            updateData.phone = this.encryptionService.encrypt(data.phone);
            updateData.phoneHash = this.encryptionService.generateHash(data.phone);
        }
        const aadhaarRaw = data.aadhaarNumber;
        if (aadhaarRaw) {
            updateData.aadhaarNumber = this.encryptionService.encrypt(aadhaarRaw);
            updateData.aadhaarHash = this.encryptionService.generateHash(aadhaarRaw);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { roles: { include: { role: { select: { name: true } } } } }
        });
        return this.decryptUser(updated);
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], UsersService);
//# sourceMappingURL=users.service.js.map