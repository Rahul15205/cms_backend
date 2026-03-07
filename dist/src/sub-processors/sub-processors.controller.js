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
exports.SubProcessorsController = void 0;
const common_1 = require("@nestjs/common");
const sub_processors_service_1 = require("./sub-processors.service");
const create_sub_processor_dto_1 = require("./dto/create-sub-processor.dto");
const update_sub_processor_dto_1 = require("./dto/update-sub-processor.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let SubProcessorsController = class SubProcessorsController {
    subProcessorsService;
    constructor(subProcessorsService) {
        this.subProcessorsService = subProcessorsService;
    }
    create(createSubProcessorDto) {
        return this.subProcessorsService.create(createSubProcessorDto);
    }
    findAll() {
        return this.subProcessorsService.findAll();
    }
    findOne(id) {
        return this.subProcessorsService.findOne(id);
    }
    update(id, updateSubProcessorDto) {
        return this.subProcessorsService.update(id, updateSubProcessorDto);
    }
    remove(id) {
        return this.subProcessorsService.remove(id);
    }
};
exports.SubProcessorsController = SubProcessorsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new sub-processor' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sub_processor_dto_1.CreateSubProcessorDto]),
    __metadata("design:returntype", void 0)
], SubProcessorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve all sub-processors' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubProcessorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a sub-processor by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubProcessorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a sub-processor by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sub_processor_dto_1.UpdateSubProcessorDto]),
    __metadata("design:returntype", void 0)
], SubProcessorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a sub-processor by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubProcessorsController.prototype, "remove", null);
exports.SubProcessorsController = SubProcessorsController = __decorate([
    (0, swagger_1.ApiTags)('Sub Processors'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/sub-processors'),
    __metadata("design:paramtypes", [sub_processors_service_1.SubProcessorsService])
], SubProcessorsController);
//# sourceMappingURL=sub-processors.controller.js.map