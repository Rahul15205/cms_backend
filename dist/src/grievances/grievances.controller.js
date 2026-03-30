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
exports.GrievancesController = void 0;
const common_1 = require("@nestjs/common");
const grievances_service_1 = require("./grievances.service");
const create_grievance_dto_1 = require("./dto/create-grievance.dto");
const update_grievance_dto_1 = require("./dto/update-grievance.dto");
const create_grievance_comment_dto_1 = require("./dto/create-grievance-comment.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let GrievancesController = class GrievancesController {
    grievancesService;
    constructor(grievancesService) {
        this.grievancesService = grievancesService;
    }
    create(dto) {
        return this.grievancesService.create(dto);
    }
    findAll(status, category, priority, assignedTo, search, tenantId, limit, offset) {
        return this.grievancesService.findAll({ status, category, priority, assignedTo, search, tenantId, limit, offset });
    }
    getMetrics() {
        return this.grievancesService.getMetrics();
    }
    findOne(id) {
        return this.grievancesService.findOne(id);
    }
    update(id, dto) {
        return this.grievancesService.update(id, dto);
    }
    addComment(id, dto, req) {
        return this.grievancesService.addComment(id, dto, req.user.userId);
    }
    escalate(id, req) {
        return this.grievancesService.escalate(id, req.user.userId);
    }
};
exports.GrievancesController = GrievancesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'File a new grievance (auto-generates case number GRV-YYYY-NNNN)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_grievance_dto_1.CreateGrievanceDto]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List grievances with pagination and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.GrievanceStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'priority', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'assignedTo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('assignedTo')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('tenantId')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get grievance metrics (total, by status, category, priority)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get grievance details with comments' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update grievance fields' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_grievance_dto_1.UpdateGrievanceDto]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/comment'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Add a comment to a grievance' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_grievance_comment_dto_1.CreateGrievanceCommentDto, Object]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(':id/escalate'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.GRIEVANCES, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Escalate a grievance (validates status transition)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GrievancesController.prototype, "escalate", null);
exports.GrievancesController = GrievancesController = __decorate([
    (0, swagger_1.ApiTags)('Grievances'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/grievances'),
    __metadata("design:paramtypes", [grievances_service_1.GrievancesService])
], GrievancesController);
//# sourceMappingURL=grievances.controller.js.map