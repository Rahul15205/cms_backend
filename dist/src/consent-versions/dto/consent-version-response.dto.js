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
exports.ConsentVersionResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const consent_template_response_dto_1 = require("../../consent-templates/dto/consent-template-response.dto");
class ConsentVersionResponseDto {
    id;
    versionNumber;
    content;
    templateId;
    publishedBy;
    publishedAt;
    template;
}
exports.ConsentVersionResponseDto = ConsentVersionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ConsentVersionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ConsentVersionResponseDto.prototype, "versionNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ConsentVersionResponseDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ConsentVersionResponseDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ConsentVersionResponseDto.prototype, "publishedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ConsentVersionResponseDto.prototype, "publishedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => consent_template_response_dto_1.ConsentTemplateResponseDto, required: false }),
    __metadata("design:type", consent_template_response_dto_1.ConsentTemplateResponseDto)
], ConsentVersionResponseDto.prototype, "template", void 0);
//# sourceMappingURL=consent-version-response.dto.js.map