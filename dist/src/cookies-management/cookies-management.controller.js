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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookiesManagementController = void 0;
const common_1 = require("@nestjs/common");
const cookies_management_service_1 = require("./cookies-management.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_cookie_category_dto_1 = require("./dto/create-cookie-category.dto");
const create_cookie_inventory_dto_1 = require("./dto/create-cookie-inventory.dto");
const create_scanned_website_dto_1 = require("./dto/create-scanned-website.dto");
const create_cookie_banner_dto_1 = require("./dto/create-cookie-banner.dto");
const create_cookie_consent_log_dto_1 = require("./dto/create-cookie-consent-log.dto");
let CookiesManagementController = class CookiesManagementController {
    cookiesManagementService;
    constructor(cookiesManagementService) {
        this.cookiesManagementService = cookiesManagementService;
    }
    createCategory(dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.createCategory(dto, tenantId);
    }
    getCategories(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getCategories(tenantId);
    }
    updateCategory(id, dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.updateCategory(id, dto, tenantId);
    }
    deleteCategory(id, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.deleteCategory(id, tenantId);
    }
    createCookie(dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.createCookie(dto, tenantId);
    }
    getInventory(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getInventory(tenantId);
    }
    updateCookie(id, dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.updateCookie(id, dto, tenantId);
    }
    deleteCookie(id, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.deleteCookie(id, tenantId);
    }
    createWebsite(dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.createWebsite(dto, tenantId);
    }
    getWebsites(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getWebsites(tenantId);
    }
    updateWebsite(id, dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.updateWebsite(id, dto, tenantId);
    }
    deleteWebsite(id, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.deleteWebsite(id, tenantId);
    }
    startScan(id, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.startScan(id, tenantId);
    }
    createBanner(dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.createBanner(dto, tenantId);
    }
    getBanners(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getBanners(tenantId);
    }
    updateBanner(id, dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.updateBanner(id, dto, tenantId);
    }
    deleteBanner(id, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.deleteBanner(id, tenantId);
    }
    recordConsentLog(dto, req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.recordConsentLog(dto, tenantId);
    }
    getConsentLogs(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getConsentLogs(tenantId);
    }
    getComplianceMetrics(req) {
        const tenantId = req.user.tenantId;
        return this.cookiesManagementService.getComplianceMetrics(tenantId);
    }
};
exports.CookiesManagementController = CookiesManagementController;
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cookie_category_dto_1.CreateCookieCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('categories'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Put)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('inventory'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cookie_inventory_dto_1.CreateCookieInventoryDto, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "createCookie", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Put)('inventory/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "updateCookie", null);
__decorate([
    (0, common_1.Delete)('inventory/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "deleteCookie", null);
__decorate([
    (0, common_1.Post)('websites'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scanned_website_dto_1.CreateScannedWebsiteDto, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "createWebsite", null);
__decorate([
    (0, common_1.Get)('websites'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getWebsites", null);
__decorate([
    (0, common_1.Put)('websites/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "updateWebsite", null);
__decorate([
    (0, common_1.Delete)('websites/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "deleteWebsite", null);
__decorate([
    (0, common_1.Post)('scan/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "startScan", null);
__decorate([
    (0, common_1.Post)('banners'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cookie_banner_dto_1.CreateCookieBannerDto, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "createBanner", null);
__decorate([
    (0, common_1.Get)('banners'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getBanners", null);
__decorate([
    (0, common_1.Put)('banners/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "updateBanner", null);
__decorate([
    (0, common_1.Delete)('banners/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "deleteBanner", null);
__decorate([
    (0, common_1.Post)('consent-logs'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cookie_consent_log_dto_1.CreateCookieConsentLogDto, Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "recordConsentLog", null);
__decorate([
    (0, common_1.Get)('consent-logs'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getConsentLogs", null);
__decorate([
    (0, common_1.Get)('compliance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CookiesManagementController.prototype, "getComplianceMetrics", null);
exports.CookiesManagementController = CookiesManagementController = __decorate([
    (0, common_1.Controller)('api/v1/cookies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cookies_management_service_1.CookiesManagementService])
], CookiesManagementController);
//# sourceMappingURL=cookies-management.controller.js.map