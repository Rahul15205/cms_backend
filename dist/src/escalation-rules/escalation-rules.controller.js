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
exports.EscalationRulesController = void 0;
const common_1 = require("@nestjs/common");
const escalation_rules_service_1 = require("./escalation-rules.service");
const create_escalation_rule_dto_1 = require("./dto/create-escalation-rule.dto");
const update_escalation_rule_dto_1 = require("./dto/update-escalation-rule.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let EscalationRulesController = class EscalationRulesController {
    escalationRulesService;
    constructor(escalationRulesService) {
        this.escalationRulesService = escalationRulesService;
    }
    create(dto) {
        return this.escalationRulesService.create(dto);
    }
    findAll(triggerCondition, status, tenantId, limit, offset) {
        return this.escalationRulesService.findAll({ triggerCondition, status, tenantId, limit, offset });
    }
    findOne(id) {
        return this.escalationRulesService.findOne(id);
    }
    update(id, dto) {
        return this.escalationRulesService.update(id, dto);
    }
    remove(id) {
        return this.escalationRulesService.remove(id);
    }
};
exports.EscalationRulesController = EscalationRulesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new escalation rule' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_escalation_rule_dto_1.CreateEscalationRuleDto]),
    __metadata("design:returntype", void 0)
], EscalationRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List escalation rules with filters and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'triggerCondition', enum: client_1.EscalationTrigger, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.ConfigRuleStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    __param(0, (0, common_1.Query)('triggerCondition')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], EscalationRulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific escalation rule by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscalationRulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an escalation rule' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_escalation_rule_dto_1.UpdateEscalationRuleDto]),
    __metadata("design:returntype", void 0)
], EscalationRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONFIGURATIONS, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an escalation rule' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscalationRulesController.prototype, "remove", null);
exports.EscalationRulesController = EscalationRulesController = __decorate([
    (0, swagger_1.ApiTags)('Escalation Rules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/config/escalation-rules'),
    __metadata("design:paramtypes", [escalation_rules_service_1.EscalationRulesService])
], EscalationRulesController);
//# sourceMappingURL=escalation-rules.controller.js.map