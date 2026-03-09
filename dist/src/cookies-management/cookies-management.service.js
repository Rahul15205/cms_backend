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
exports.CookiesManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CookiesManagementService = class CookiesManagementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCategory(dto, tenantId) {
        return this.prisma.cookieCategory.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async getCategories(tenantId) {
        return this.prisma.cookieCategory.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { cookies: true },
                },
            },
        });
    }
    async updateCategory(id, dto, tenantId) {
        const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
        if (!category || category.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Category not found');
        }
        return this.prisma.cookieCategory.update({ where: { id }, data: dto });
    }
    async deleteCategory(id, tenantId) {
        const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
        if (!category || category.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Category not found');
        }
        return this.prisma.cookieCategory.delete({ where: { id } });
    }
    async createCookie(dto, tenantId) {
        const category = await this.prisma.cookieCategory.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Cookie category not found');
        }
        return this.prisma.cookieInventory.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async getInventory(tenantId) {
        return this.prisma.cookieInventory.findMany({
            where: { tenantId },
            include: {
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateCookie(id, dto, tenantId) {
        const cookie = await this.prisma.cookieInventory.findUnique({
            where: { id },
        });
        if (!cookie || cookie.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Cookie not found');
        }
        return this.prisma.cookieInventory.update({
            where: { id },
            data: dto,
        });
    }
    async deleteCookie(id, tenantId) {
        const cookie = await this.prisma.cookieInventory.findUnique({ where: { id } });
        if (!cookie || cookie.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Cookie not found');
        }
        return this.prisma.cookieInventory.delete({ where: { id } });
    }
    async createWebsite(dto, tenantId) {
        return this.prisma.scannedWebsite.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async getWebsites(tenantId) {
        return this.prisma.scannedWebsite.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateWebsite(id, dto, tenantId) {
        const website = await this.prisma.scannedWebsite.findUnique({
            where: { id },
        });
        if (!website || website.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Website not found');
        }
        return this.prisma.scannedWebsite.update({
            where: { id },
            data: dto,
        });
    }
    async startScan(id, tenantId) {
        const website = await this.prisma.scannedWebsite.findUnique({
            where: { id },
        });
        if (!website || website.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Website not found');
        }
        return this.prisma.scannedWebsite.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS',
                lastScan: new Date(),
            },
        });
    }
    async deleteWebsite(id, tenantId) {
        const website = await this.prisma.scannedWebsite.findUnique({ where: { id } });
        if (!website || website.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Website not found');
        }
        return this.prisma.scannedWebsite.delete({ where: { id } });
    }
    async createBanner(dto, tenantId) {
        return this.prisma.cookieBanner.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async getBanners(tenantId) {
        return this.prisma.cookieBanner.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateBanner(id, dto, tenantId) {
        const banner = await this.prisma.cookieBanner.findUnique({
            where: { id },
        });
        if (!banner || banner.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Banner not found');
        }
        return this.prisma.cookieBanner.update({
            where: { id },
            data: dto,
        });
    }
    async deleteBanner(id, tenantId) {
        const banner = await this.prisma.cookieBanner.findUnique({ where: { id } });
        if (!banner || banner.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Banner not found');
        }
        return this.prisma.cookieBanner.delete({ where: { id } });
    }
    async recordConsentLog(dto, tenantId) {
        return this.prisma.cookieConsentLog.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }
    async getConsentLogs(tenantId) {
        return this.prisma.cookieConsentLog.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            take: 100,
        });
    }
    async getComplianceMetrics(tenantId) {
        const banners = await this.prisma.cookieBanner.count({
            where: { tenantId },
        });
        const activeBanners = await this.prisma.cookieBanner.count({
            where: { tenantId, status: 'ACTIVE' },
        });
        const totalLogs = await this.prisma.cookieConsentLog.count({
            where: { tenantId },
        });
        const acceptedCount = await this.prisma.cookieConsentLog.count({
            where: { tenantId, status: 'ACCEPTED' },
        });
        const withdrawnCount = await this.prisma.cookieConsentLog.count({
            where: { tenantId, status: 'WITHDRAWN' },
        });
        const websiteCount = await this.prisma.scannedWebsite.count({
            where: { tenantId },
        });
        return {
            banners: {
                total: banners,
                active: activeBanners,
            },
            consentLogs: {
                total: totalLogs,
                accepted: acceptedCount,
                withdrawn: withdrawnCount,
            },
            websites: websiteCount,
            complianceScore: totalLogs > 0 ? Math.round((acceptedCount / totalLogs) * 100) : 100,
        };
    }
};
exports.CookiesManagementService = CookiesManagementService;
exports.CookiesManagementService = CookiesManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CookiesManagementService);
//# sourceMappingURL=cookies-management.service.js.map