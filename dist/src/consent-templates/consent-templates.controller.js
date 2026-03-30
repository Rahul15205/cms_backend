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
exports.ConsentTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const consent_templates_service_1 = require("./consent-templates.service");
const create_consent_template_dto_1 = require("./dto/create-consent-template.dto");
const update_consent_template_dto_1 = require("./dto/update-consent-template.dto");
const consent_template_response_dto_1 = require("./dto/consent-template-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
let ConsentTemplatesController = class ConsentTemplatesController {
    consentTemplatesService;
    constructor(consentTemplatesService) {
        this.consentTemplatesService = consentTemplatesService;
    }
    create(createConsentTemplateDto, req) {
        return this.consentTemplatesService.create(createConsentTemplateDto, req.user.tenantId, req.user.userId);
    }
    findAll(status, search, tenantId, limit, offset) {
        return this.consentTemplatesService.findAll({ status, search, tenantId, limit, offset });
    }
    findOne(id) {
        return this.consentTemplatesService.findOne(id);
    }
    update(id, updateConsentTemplateDto) {
        return this.consentTemplatesService.update(id, updateConsentTemplateDto);
    }
    remove(id) {
        return this.consentTemplatesService.remove(id);
    }
};
exports.ConsentTemplatesController = ConsentTemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Consent Template' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: consent_template_response_dto_1.ConsentTemplateResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_consent_template_dto_1.CreateConsentTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], ConsentTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List Consent Templates' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.TemplateStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_response_dto_1.PaginatedResponseDto }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], ConsentTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific Consent Template details' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_template_response_dto_1.ConsentTemplateResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing Consent Template' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_template_response_dto_1.ConsentTemplateResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_consent_template_dto_1.UpdateConsentTemplateDto]),
    __metadata("design:returntype", void 0)
], ConsentTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a Consent Template' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentTemplatesController.prototype, "remove", null);
exports.ConsentTemplatesController = ConsentTemplatesController = __decorate([
    (0, swagger_1.ApiTags)('Consent Templates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/consent-templates'),
    __metadata("design:paramtypes", [consent_templates_service_1.ConsentTemplatesService])
], ConsentTemplatesController);
//# sourceMappingURL=consent-templates.controller.js.map