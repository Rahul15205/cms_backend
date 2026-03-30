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
exports.NoticesController = void 0;
const common_1 = require("@nestjs/common");
const notices_service_1 = require("./notices.service");
const create_notice_dto_1 = require("./dto/create-notice.dto");
const update_notice_dto_1 = require("./dto/update-notice.dto");
const create_notice_type_dto_1 = require("./dto/create-notice-type.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let NoticesController = class NoticesController {
    noticesService;
    constructor(noticesService) {
        this.noticesService = noticesService;
    }
    create(dto, req) {
        return this.noticesService.create(dto, req.user.userId);
    }
    findAll(status, typeId, tenantId, search, limit, offset) {
        return this.noticesService.findAll({ status, typeId, tenantId, search, limit, offset });
    }
    getLanguages(tenantId) {
        return this.noticesService.getLanguages(tenantId);
    }
    createLanguage(dto) {
        return this.noticesService.createLanguage(dto);
    }
    updateLanguage(id, dto) {
        return this.noticesService.updateLanguage(id, dto);
    }
    deleteLanguage(id) {
        return this.noticesService.deleteLanguage(id);
    }
    getTypes(tenantId) {
        return this.noticesService.getTypes(tenantId);
    }
    createType(dto) {
        return this.noticesService.createType(dto);
    }
    getGlobalHistory() {
        return this.noticesService.getGlobalHistory();
    }
    findOne(id) {
        return this.noticesService.findOne(id);
    }
    update(id, dto, req) {
        return this.noticesService.update(id, dto, req.user.userId);
    }
    getHistory(id) {
        return this.noticesService.getHistory(id);
    }
};
exports.NoticesController = NoticesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new notice (auto-creates v1 snapshot)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_notice_dto_1.CreateNoticeDto, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List notices with filters and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.NoticeStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'typeId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('typeId')),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('languages'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List available notice languages and their completion status' }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getLanguages", null);
__decorate([
    (0, common_1.Post)('languages'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new notice language' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "createLanguage", null);
__decorate([
    (0, common_1.Put)('languages/:id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a notice language' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "updateLanguage", null);
__decorate([
    (0, common_1.Delete)('languages/:id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a notice language' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "deleteLanguage", null);
__decorate([
    (0, common_1.Get)('types'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List notice types (e.g., Privacy Policy, Terms of Service)' }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new notice type' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_notice_type_dto_1.CreateNoticeTypeDto]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "createType", null);
__decorate([
    (0, common_1.Get)('history/global'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get global version history across all notices' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getGlobalHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific notice with its version history' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a notice (auto-versions on content/title changes)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_notice_dto_1.UpdateNoticeDto, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.NOTICES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get version history for a specific notice' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getHistory", null);
exports.NoticesController = NoticesController = __decorate([
    (0, swagger_1.ApiTags)('Notices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/notices'),
    __metadata("design:paramtypes", [notices_service_1.NoticesService])
], NoticesController);
//# sourceMappingURL=notices.controller.js.map