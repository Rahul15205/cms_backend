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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto, tenantId) {
        const { permissions, ...roleData } = createRoleDto;
        return this.prisma.role.create({
            data: {
                ...roleData,
                tenantId,
                permissions: {
                    create: permissions,
                },
            },
            include: { permissions: true },
        });
    }
    findAll() {
        return this.prisma.role.findMany({
            include: { permissions: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
    async update(id, updateRoleDto) {
        const { permissions, ...roleData } = updateRoleDto;
        await this.findOne(id);
        if (permissions) {
            await this.prisma.permission.deleteMany({ where: { roleId: id } });
        }
        return this.prisma.role.update({
            where: { id },
            data: {
                ...roleData,
                ...(permissions ? { permissions: { create: permissions } } : {})
            },
            include: { permissions: true },
        });
    }
    async remove(id) {
        const role = await this.findOne(id);
        if (role.isSystemRole) {
            throw new common_1.BadRequestException('Cannot delete a system role');
        }
        return this.prisma.role.delete({ where: { id } });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map