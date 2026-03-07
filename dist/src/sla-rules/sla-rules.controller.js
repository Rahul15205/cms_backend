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
exports.SlaRulesController = void 0;
const common_1 = require("@nestjs/common");
const sla_rules_service_1 = require("./sla-rules.service");
const create_sla_rule_dto_1 = require("./dto/create-sla-rule.dto");
const update_sla_rule_dto_1 = require("./dto/update-sla-rule.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let SlaRulesController = class SlaRulesController {
    slaRulesService;
    constructor(slaRulesService) {
        this.slaRulesService = slaRulesService;
    }
    create(dto) {
        return this.slaRulesService.create(dto);
    }
    findAll(scope, regulation, status, tenantId, limit, offset) {
        return this.slaRulesService.findAll({ scope, regulation, status, tenantId, limit, offset });
    }
    findOne(id) {
        return this.slaRulesService.findOne(id);
    }
    update(id, dto) {
        return this.slaRulesService.update(id, dto);
    }
    remove(id) {
        return this.slaRulesService.remove(id);
    }
};
exports.SlaRulesController = SlaRulesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new SLA rule' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sla_rule_dto_1.CreateSlaRuleDto]),
    __metadata("design:returntype", void 0)
], SlaRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List SLA rules with filters and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'scope', enum: client_1.SLAScope, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'regulation', enum: client_1.Regulation, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.SLARuleStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('regulation')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('tenantId')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], SlaRulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific SLA rule by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SlaRulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an SLA rule' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sla_rule_dto_1.UpdateSlaRuleDto]),
    __metadata("design:returntype", void 0)
], SlaRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an SLA rule' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SlaRulesController.prototype, "remove", null);
exports.SlaRulesController = SlaRulesController = __decorate([
    (0, swagger_1.ApiTags)('SLA Rules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/config/sla-rules'),
    __metadata("design:paramtypes", [sla_rules_service_1.SlaRulesService])
], SlaRulesController);
//# sourceMappingURL=sla-rules.controller.js.map