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
exports.ThirdPartiesController = void 0;
const common_1 = require("@nestjs/common");
const third_parties_service_1 = require("./third-parties.service");
const create_third_party_dto_1 = require("./dto/create-third-party.dto");
const update_third_party_dto_1 = require("./dto/update-third-party.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let ThirdPartiesController = class ThirdPartiesController {
    thirdPartiesService;
    constructor(thirdPartiesService) {
        this.thirdPartiesService = thirdPartiesService;
    }
    create(createThirdPartyDto) {
        return this.thirdPartiesService.create(createThirdPartyDto);
    }
    findAll() {
        return this.thirdPartiesService.findAll();
    }
    findOne(id) {
        return this.thirdPartiesService.findOne(id);
    }
    update(id, updateThirdPartyDto) {
        return this.thirdPartiesService.update(id, updateThirdPartyDto);
    }
    remove(id) {
        return this.thirdPartiesService.remove(id);
    }
};
exports.ThirdPartiesController = ThirdPartiesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new third party' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_third_party_dto_1.CreateThirdPartyDto]),
    __metadata("design:returntype", void 0)
], ThirdPartiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve all third parties' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThirdPartiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'view' }),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a third party by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ThirdPartiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'edit' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a third party by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_third_party_dto_1.UpdateThirdPartyDto]),
    __metadata("design:returntype", void 0)
], ThirdPartiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)({ module: client_1.ModuleName.CONSENT_MANAGEMENT, action: 'admin' }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a third party by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ThirdPartiesController.prototype, "remove", null);
exports.ThirdPartiesController = ThirdPartiesController = __decorate([
    (0, swagger_1.ApiTags)('Third Parties'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/third-parties'),
    __metadata("design:paramtypes", [third_parties_service_1.ThirdPartiesService])
], ThirdPartiesController);
//# sourceMappingURL=third-parties.controller.js.map