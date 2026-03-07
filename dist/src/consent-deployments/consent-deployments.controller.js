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
exports.ConsentDeploymentsController = void 0;
const common_1 = require("@nestjs/common");
const consent_deployments_service_1 = require("./consent-deployments.service");
const create_consent_deployment_dto_1 = require("./dto/create-consent-deployment.dto");
const update_consent_deployment_dto_1 = require("./dto/update-consent-deployment.dto");
const consent_deployment_response_dto_1 = require("./dto/consent-deployment-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
let ConsentDeploymentsController = class ConsentDeploymentsController {
    consentDeploymentsService;
    constructor(consentDeploymentsService) {
        this.consentDeploymentsService = consentDeploymentsService;
    }
    create(createConsentDeploymentDto, req) {
        return this.consentDeploymentsService.create(createConsentDeploymentDto, req.user.userId);
    }
    findAll(applicationId, versionId, limit, offset) {
        return this.consentDeploymentsService.findAll(applicationId, versionId, limit, offset);
    }
    findOne(id) {
        return this.consentDeploymentsService.findOne(id);
    }
    getLogs(id) {
        return this.consentDeploymentsService.getDeploymentLogs(id);
    }
    update(id, updateConsentDeploymentDto) {
        return this.consentDeploymentsService.update(id, updateConsentDeploymentDto);
    }
    rollback(id, req) {
        return this.consentDeploymentsService.rollback(id, req.user.userId);
    }
    remove(id) {
        return this.consentDeploymentsService.remove(id);
    }
};
exports.ConsentDeploymentsController = ConsentDeploymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Deploy a Consent Version to an Application' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: consent_deployment_response_dto_1.ConsentDeploymentResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_consent_deployment_dto_1.CreateConsentDeploymentDto, Object]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List all deployments' }),
    (0, swagger_1.ApiQuery)({ name: 'applicationId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'versionId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_response_dto_1.PaginatedResponseDto }),
    __param(0, (0, common_1.Query)('applicationId')),
    __param(1, (0, common_1.Query)('versionId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific deployment (includes logs)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_deployment_response_dto_1.ConsentDeploymentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get deployment logs for a specific deployment' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update deployment configuration (e.g. toggle isActive, region, segment)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_deployment_response_dto_1.ConsentDeploymentResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_consent_deployment_dto_1.UpdateConsentDeploymentDto]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/rollback'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'approve' }),
    (0, swagger_1.ApiOperation)({ summary: 'Rollback a deployment (sets status to ROLLED_BACK and deactivates)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "rollback", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a deployment binding entirely' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentDeploymentsController.prototype, "remove", null);
exports.ConsentDeploymentsController = ConsentDeploymentsController = __decorate([
    (0, swagger_1.ApiTags)('Consent Deployments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/consent-deployments'),
    __metadata("design:paramtypes", [consent_deployments_service_1.ConsentDeploymentsService])
], ConsentDeploymentsController);
//# sourceMappingURL=consent-deployments.controller.js.map