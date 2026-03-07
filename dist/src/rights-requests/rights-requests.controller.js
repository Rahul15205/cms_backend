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
exports.RightsRequestsController = void 0;
const common_1 = require("@nestjs/common");
const rights_requests_service_1 = require("./rights-requests.service");
const create_rights_request_dto_1 = require("./dto/create-rights-request.dto");
const update_rights_request_dto_1 = require("./dto/update-rights-request.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const assign_request_dto_1 = require("./dto/assign-request.dto");
const create_case_note_dto_1 = require("./dto/create-case-note.dto");
const create_case_attachment_dto_1 = require("./dto/create-case-attachment.dto");
const create_evidence_item_dto_1 = require("./dto/create-evidence-item.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let RightsRequestsController = class RightsRequestsController {
    rightsRequestsService;
    constructor(rightsRequestsService) {
        this.rightsRequestsService = rightsRequestsService;
    }
    create(dto, req) {
        return this.rightsRequestsService.create(dto, req.user.userId);
    }
    findAll(status, type, priority, assignedTo, search, tenantId, limit, offset) {
        return this.rightsRequestsService.findAll({ status, type, priority, assignedTo, search, tenantId, limit, offset });
    }
    findOne(id) {
        return this.rightsRequestsService.findOne(id);
    }
    update(id, dto) {
        return this.rightsRequestsService.update(id, dto);
    }
    updateStatus(id, dto, req) {
        return this.rightsRequestsService.updateStatus(id, dto, req.user.userId);
    }
    assign(id, dto, req) {
        return this.rightsRequestsService.assign(id, dto, req.user.userId);
    }
    getWorkflow(id) {
        return this.rightsRequestsService.getWorkflow(id);
    }
    getNotes(id) {
        return this.rightsRequestsService.getNotes(id);
    }
    addNote(id, dto, req) {
        return this.rightsRequestsService.addNote(id, dto, req.user.userId);
    }
    getAttachments(id) {
        return this.rightsRequestsService.getAttachments(id);
    }
    addAttachment(id, dto, req) {
        return this.rightsRequestsService.addAttachment(id, dto, req.user.userId);
    }
    getEvidence(id) {
        return this.rightsRequestsService.getEvidence(id);
    }
    addEvidence(id, dto, req) {
        return this.rightsRequestsService.addEvidence(id, dto, req.user.userId);
    }
    getAuditTrail(id) {
        return this.rightsRequestsService.getAuditTrail(id);
    }
    getMetrics() {
        return this.rightsRequestsService.getMetrics();
    }
    getAnalytics() {
        return this.rightsRequestsService.getAnalytics();
    }
};
exports.RightsRequestsController = RightsRequestsController;
__decorate([
    (0, common_1.Post)('requests'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new rights request (auto-generates case number + workflow)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rights_request_dto_1.CreateRightsRequestDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List rights requests with pagination and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.RightsRequestStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'priority', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'assignedTo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('assignedTo')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('tenantId')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get full details of a rights request (with workflow steps)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)('requests/:id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update mutable fields of a rights request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_rights_request_dto_1.UpdateRightsRequestDto]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Put)('requests/:id/status'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Transition request status (validated state machine)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)('requests/:id/assign'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Assign request to a user or team' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_request_dto_1.AssignRequestDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('requests/:id/workflow'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow steps for a request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getWorkflow", null);
__decorate([
    (0, common_1.Get)('requests/:id/notes'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List case notes for a request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Post)('requests/:id/notes'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Add a case note (internal or external)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_case_note_dto_1.CreateCaseNoteDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "addNote", null);
__decorate([
    (0, common_1.Get)('requests/:id/attachments'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List attachments for a request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getAttachments", null);
__decorate([
    (0, common_1.Post)('requests/:id/attachments'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Add an attachment to a request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_case_attachment_dto_1.CreateCaseAttachmentDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "addAttachment", null);
__decorate([
    (0, common_1.Get)('requests/:id/evidence'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List evidence items for a request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getEvidence", null);
__decorate([
    (0, common_1.Post)('requests/:id/evidence'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Add an evidence item' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_evidence_item_dto_1.CreateEvidenceItemDto, Object]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "addEvidence", null);
__decorate([
    (0, common_1.Get)('requests/:id/audit'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get full audit trail for a request' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getAuditTrail", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregate metrics (total, by status, SLA breaches, avg resolution)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.RIGHTS_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics trends (monthly trend, by regulation, by channel, verification methods, top data categories)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RightsRequestsController.prototype, "getAnalytics", null);
exports.RightsRequestsController = RightsRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Rights Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/rights'),
    __metadata("design:paramtypes", [rights_requests_service_1.RightsRequestsService])
], RightsRequestsController);
//# sourceMappingURL=rights-requests.controller.js.map