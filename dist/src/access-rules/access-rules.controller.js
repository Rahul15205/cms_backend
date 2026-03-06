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
exports.AccessRulesController = void 0;
const common_1 = require("@nestjs/common");
const access_rules_service_1 = require("./access-rules.service");
const create_access_rule_dto_1 = require("./dto/create-access-rule.dto");
const update_access_rule_dto_1 = require("./dto/update-access-rule.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let AccessRulesController = class AccessRulesController {
    accessRulesService;
    constructor(accessRulesService) {
        this.accessRulesService = accessRulesService;
    }
    create(createAccessRuleDto, req) {
        return this.accessRulesService.create(createAccessRuleDto, req.user.tenantId);
    }
    findAll(tenantId) {
        return this.accessRulesService.findAll(tenantId);
    }
    findOne(id) {
        return this.accessRulesService.findOne(id);
    }
    update(id, updateAccessRuleDto) {
        return this.accessRulesService.update(id, updateAccessRuleDto);
    }
    remove(id) {
        return this.accessRulesService.remove(id);
    }
};
exports.AccessRulesController = AccessRulesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.SECURITY, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new access rule' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_access_rule_dto_1.CreateAccessRuleDto, Object]),
    __metadata("design:returntype", void 0)
], AccessRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.SECURITY, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List all access rules' }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessRulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.SECURITY, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific access rule by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessRulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.SECURITY, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an access rule' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_access_rule_dto_1.UpdateAccessRuleDto]),
    __metadata("design:returntype", void 0)
], AccessRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.SECURITY, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an access rule' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessRulesController.prototype, "remove", null);
exports.AccessRulesController = AccessRulesController = __decorate([
    (0, swagger_1.ApiTags)('Access Rules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/access-rules'),
    __metadata("design:paramtypes", [access_rules_service_1.AccessRulesService])
], AccessRulesController);
//# sourceMappingURL=access-rules.controller.js.map