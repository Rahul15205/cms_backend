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
exports.ConsentVersionsController = void 0;
const common_1 = require("@nestjs/common");
const consent_versions_service_1 = require("./consent-versions.service");
const create_consent_version_dto_1 = require("./dto/create-consent-version.dto");
const consent_version_response_dto_1 = require("./dto/consent-version-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
let ConsentVersionsController = class ConsentVersionsController {
    consentVersionsService;
    constructor(consentVersionsService) {
        this.consentVersionsService = consentVersionsService;
    }
    create(createConsentVersionDto, req) {
        return this.consentVersionsService.create(createConsentVersionDto, req.user.userId);
    }
    findAll(templateId, limit, offset) {
        return this.consentVersionsService.findAll(templateId, limit, offset);
    }
    findOne(id) {
        return this.consentVersionsService.findOne(id);
    }
};
exports.ConsentVersionsController = ConsentVersionsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a new Consent Version (freezes template content)' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: consent_version_response_dto_1.ConsentVersionResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_consent_version_dto_1.CreateConsentVersionDto, Object]),
    __metadata("design:returntype", void 0)
], ConsentVersionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List Consent Versions historically' }),
    (0, swagger_1.ApiQuery)({ name: 'templateId', required: false, description: 'Filter versions by their parent template' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_response_dto_1.PaginatedResponseDto }),
    __param(0, (0, common_1.Query)('templateId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], ConsentVersionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific Consent Version snapshot structurally' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_version_response_dto_1.ConsentVersionResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentVersionsController.prototype, "findOne", null);
exports.ConsentVersionsController = ConsentVersionsController = __decorate([
    (0, swagger_1.ApiTags)('Consent Versions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/consent-versions'),
    __metadata("design:paramtypes", [consent_versions_service_1.ConsentVersionsService])
], ConsentVersionsController);
//# sourceMappingURL=consent-versions.controller.js.map