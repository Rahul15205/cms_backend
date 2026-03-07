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
exports.CreateDataCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateDataCategoryDto {
    category;
    label;
    mandatory;
    source;
    description;
    country;
    templateId;
}
exports.CreateDataCategoryDto = CreateDataCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DataCategory, description: 'The category of the data' }),
    (0, class_validator_1.IsEnum)(client_1.DataCategory),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Label or display name for the data category' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Indicates if this data is mandatory', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateDataCategoryDto.prototype, "mandatory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.DataSource, description: 'Source of the data', default: client_1.DataSource.DIRECT }),
    (0, class_validator_1.IsEnum)(client_1.DataSource),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description of the data category' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Country of origin or processing' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the associated ConsentTemplate' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDataCategoryDto.prototype, "templateId", void 0);
//# sourceMappingURL=create-data-category.dto.js.map