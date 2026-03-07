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
exports.ThirdPartiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ThirdPartiesService = class ThirdPartiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createThirdPartyDto) {
        const { templateId, ...data } = createThirdPartyDto;
        const templateExists = await this.prisma.consentTemplate.findUnique({
            where: { id: templateId },
        });
        if (!templateExists) {
            throw new common_1.NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
        }
        return this.prisma.thirdParty.create({
            data: {
                ...data,
                template: {
                    connect: { id: templateId },
                },
            },
        });
    }
    async findAll() {
        return this.prisma.thirdParty.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const thirdParty = await this.prisma.thirdParty.findUnique({
            where: { id },
            include: { template: true },
        });
        if (!thirdParty) {
            throw new common_1.NotFoundException(`ThirdParty with ID ${id} not found`);
        }
        return thirdParty;
    }
    async update(id, updateThirdPartyDto) {
        const { templateId, ...updateData } = updateThirdPartyDto;
        await this.findOne(id);
        if (templateId) {
            const templateExists = await this.prisma.consentTemplate.findUnique({
                where: { id: templateId },
            });
            if (!templateExists) {
                throw new common_1.NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
            }
        }
        return this.prisma.thirdParty.update({
            where: { id },
            data: {
                ...updateData,
                ...(templateId && { template: { connect: { id: templateId } } })
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.thirdParty.delete({
            where: { id },
        });
    }
};
exports.ThirdPartiesService = ThirdPartiesService;
exports.ThirdPartiesService = ThirdPartiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ThirdPartiesService);
//# sourceMappingURL=third-parties.service.js.map