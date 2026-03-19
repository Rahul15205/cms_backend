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
exports.CreateConsentTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateConsentTemplateDto {
    title;
    description;
    type;
    regulations;
    status;
    noExpiry;
    targetUserCategory;
    ageThreshold;
    consentGivenBy;
    mechanism;
    separateConsents;
    withdrawVisible;
    dataSharing;
    privacyNoticeRef;
    auditTrailEnabled;
    defaultLanguage;
    supportedLanguages;
    wizardFields;
}
exports.CreateConsentTemplateDto = CreateConsentTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Terms of Service v1' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Standard terms of service agreement for end-users.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ConsentType, example: client_1.ConsentType.EXPLICIT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ConsentType),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Regulation, isArray: true, example: [client_1.Regulation.GDPR] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.Regulation, { each: true }),
    __metadata("design:type", Array)
], CreateConsentTemplateDto.prototype, "regulations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.TemplateStatus, example: client_1.TemplateStatus.DRAFT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TemplateStatus),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConsentTemplateDto.prototype, "noExpiry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.TargetUserCategory, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.TargetUserCategory, { each: true }),
    __metadata("design:type", Array)
], CreateConsentTemplateDto.prototype, "targetUserCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 18 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateConsentTemplateDto.prototype, "ageThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ConsentGivenBy }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ConsentGivenBy),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "consentGivenBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ConsentMechanism }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ConsentMechanism),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "mechanism", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConsentTemplateDto.prototype, "separateConsents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConsentTemplateDto.prototype, "withdrawVisible", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConsentTemplateDto.prototype, "dataSharing", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "privacyNoticeRef", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConsentTemplateDto.prototype, "auditTrailEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'en' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentTemplateDto.prototype, "defaultLanguage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ isArray: true, example: ['en'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateConsentTemplateDto.prototype, "supportedLanguages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { questions: [] } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateConsentTemplateDto.prototype, "wizardFields", void 0);
//# sourceMappingURL=create-consent-template.dto.js.map