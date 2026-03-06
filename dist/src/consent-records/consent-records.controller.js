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
exports.ConsentRecordsController = void 0;
const common_1 = require("@nestjs/common");
const consent_records_service_1 = require("./consent-records.service");
const create_consent_record_dto_1 = require("./dto/create-consent-record.dto");
const update_consent_record_dto_1 = require("./dto/update-consent-record.dto");
const consent_record_response_dto_1 = require("./dto/consent-record-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const paginated_response_dto_1 = require("../common/dto/paginated-response.dto");
let ConsentRecordsController = class ConsentRecordsController {
    consentRecordsService;
    constructor(consentRecordsService) {
        this.consentRecordsService = consentRecordsService;
    }
    create(createConsentRecordDto) {
        return this.consentRecordsService.create(createConsentRecordDto);
    }
    findAll(status, versionId, applicationId, userId, email, limit, offset) {
        return this.consentRecordsService.findAll(status, versionId, applicationId, userId, email, limit, offset);
    }
    findOne(id) {
        return this.consentRecordsService.findOne(id);
    }
    update(id, updateConsentRecordDto) {
        return this.consentRecordsService.update(id, updateConsentRecordDto);
    }
};
exports.ConsentRecordsController = ConsentRecordsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Ingest a new Consent Agreement Record from an End User' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: consent_record_response_dto_1.ConsentRecordResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_consent_record_dto_1.CreateConsentRecordDto]),
    __metadata("design:returntype", void 0)
], ConsentRecordsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'List and filter Consent Records natively' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.ConsentStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'versionId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'applicationId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: paginated_response_dto_1.PaginatedResponseDto }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('versionId')),
    __param(2, (0, common_1.Query)('applicationId')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('email')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], ConsentRecordsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Inspect a specific Consent Record detail strictly' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_record_response_dto_1.ConsentRecordResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsentRecordsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a Consent Record (i.e. to register a REVOKED signal)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: consent_record_response_dto_1.ConsentRecordResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_consent_record_dto_1.UpdateConsentRecordDto]),
    __metadata("design:returntype", void 0)
], ConsentRecordsController.prototype, "update", null);
exports.ConsentRecordsController = ConsentRecordsController = __decorate([
    (0, swagger_1.ApiTags)('Consent Records'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/consent-records'),
    __metadata("design:paramtypes", [consent_records_service_1.ConsentRecordsService])
], ConsentRecordsController);
//# sourceMappingURL=consent-records.controller.js.map