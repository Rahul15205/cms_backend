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
exports.AccessRulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AccessRulesService = class AccessRulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createAccessRuleDto, tenantId) {
        return this.prisma.accessRule.create({
            data: {
                ...createAccessRuleDto,
                tenantId
            }
        });
    }
    findAll(tenantId) {
        const where = tenantId ? { tenantId } : {};
        return this.prisma.accessRule.findMany({
            where,
            orderBy: { priority: 'desc' }
        });
    }
    async findOne(id) {
        const rule = await this.prisma.accessRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Access rule not found');
        return rule;
    }
    async update(id, updateAccessRuleDto) {
        await this.findOne(id);
        return this.prisma.accessRule.update({
            where: { id },
            data: updateAccessRuleDto
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.accessRule.delete({ where: { id } });
    }
};
exports.AccessRulesService = AccessRulesService;
exports.AccessRulesService = AccessRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccessRulesService);
//# sourceMappingURL=access-rules.service.js.map