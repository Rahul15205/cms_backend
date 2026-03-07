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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateThirdPartyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateThirdPartyDto {
    name;
    role;
    purpose;
    country;
    crossBorderTransfer;
    templateId;
}
exports.CreateThirdPartyDto = CreateThirdPartyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the third party' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThirdPartyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ThirdPartyRole, description: 'Role of the third party (e.g., DATA_PROCESSOR)' }),
    (0, class_validator_1.IsEnum)(client_1.ThirdPartyRole),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThirdPartyDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Purpose for data sharing' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThirdPartyDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Country of the third party' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThirdPartyDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Indicates if data transfer across borders is involved', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateThirdPartyDto.prototype, "crossBorderTransfer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the associated ConsentTemplate' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateThirdPartyDto.prototype, "templateId", void 0);
//# sourceMappingURL=create-third-party.dto.js.map