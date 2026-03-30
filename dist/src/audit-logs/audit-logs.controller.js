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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const audit_logs_service_1 = require("./audit-logs.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let AuditLogsController = class AuditLogsController {
    auditLogsService;
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    async findAll(tenantId, userId, category, severity, startDate, endDate, limit, page, anonymize) {
        const limitNum = limit ? Number(limit) : 10;
        const pageNum = page ? Number(page) : 1;
        const isAnonymize = anonymize === 'true' || anonymize === '1';
        const { data, total } = await this.auditLogsService.findAll({
            tenantId, userId, category, severity, startDate, endDate,
            limit: limitNum,
            page: pageNum,
            anonymize: isAnonymize
        });
        return {
            total,
            data,
            page: pageNum,
            limit: limitNum
        };
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.LOGS, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated and filtered application audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', enum: client_1.AuditCategory, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'severity', enum: client_1.AuditSeverity, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', type: Date, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', type: Date, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false, description: 'Default: 10' }),
    (0, swagger_1.ApiQuery)({ name: 'anonymize', type: Boolean, required: false, description: 'Anonymize/Mask PII fields in logs' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('severity')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('anonymize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "findAll", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('Audit Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/audit-logs'),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map