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
exports.DataCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DataCategoriesService = class DataCategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDataCategoryDto) {
        const { templateId, ...data } = createDataCategoryDto;
        const templateExists = await this.prisma.consentTemplate.findUnique({
            where: { id: templateId },
        });
        if (!templateExists) {
            throw new common_1.NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
        }
        return this.prisma.dataCategoryConfig.create({
            data: {
                ...data,
                template: {
                    connect: { id: templateId },
                },
            },
        });
    }
    async findAll() {
        return this.prisma.dataCategoryConfig.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const dataCategory = await this.prisma.dataCategoryConfig.findUnique({
            where: { id },
            include: { template: true },
        });
        if (!dataCategory) {
            throw new common_1.NotFoundException(`DataCategoryConfig with ID ${id} not found`);
        }
        return dataCategory;
    }
    async update(id, updateDataCategoryDto) {
        const { templateId, ...updateData } = updateDataCategoryDto;
        await this.findOne(id);
        if (templateId) {
            const templateExists = await this.prisma.consentTemplate.findUnique({
                where: { id: templateId },
            });
            if (!templateExists) {
                throw new common_1.NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
            }
        }
        return this.prisma.dataCategoryConfig.update({
            where: { id },
            data: {
                ...updateData,
                ...(templateId && { template: { connect: { id: templateId } } })
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.dataCategoryConfig.delete({
            where: { id },
        });
    }
};
exports.DataCategoriesService = DataCategoriesService;
exports.DataCategoriesService = DataCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DataCategoriesService);
//# sourceMappingURL=data-categories.service.js.map