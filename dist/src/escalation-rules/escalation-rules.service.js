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
exports.EscalationRulesService = void 0;
const common_1 = require("@nestjs/common");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
const prisma_service_1 = require("../prisma/prisma.service");
let EscalationRulesService = class EscalationRulesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        return this.prisma.escalationRule.create({
            data: dto,
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.triggerCondition)
            where.triggerCondition = filters.triggerCondition;
        if (filters.status)
            where.status = filters.status;
        if (filters.tenantId)
            where.tenantId = filters.tenantId;
        const take = filters.limit ? Number(filters.limit) : 50;
        const skip = filters.offset ? Number(filters.offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.escalationRule.count({ where }),
            this.prisma.escalationRule.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return (0, paginated_response_dto_1.paginate)(data, total, Math.floor(skip / take) + 1, take);
    }
    async findOne(id) {
        const rule = await this.prisma.escalationRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Escalation rule not found');
        return rule;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.escalationRule.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.escalationRule.delete({ where: { id } });
    }
};
exports.EscalationRulesService = EscalationRulesService;
exports.EscalationRulesService = EscalationRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscalationRulesService);
//# sourceMappingURL=escalation-rules.service.js.map