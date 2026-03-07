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
exports.CreateRightsRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateRightsRequestDto {
    type;
    regulation;
    priority;
    requesterId;
    requesterName;
    requesterEmail;
    requesterPhone;
    isAuthorizedRep;
    authorizedRepDetails;
    description;
    dataCategories;
    relatedConsents;
    relatedApplications;
    submissionChannel;
    dueDate;
    tenantId;
}
exports.CreateRightsRequestDto = CreateRightsRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RightsRequestType }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.RightsRequestType),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Regulation }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.Regulation),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "regulation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RightsRequestPriority, default: 'NORMAL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RightsRequestPriority),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'REQ-001' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "requesterId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "requesterName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "requesterEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+91-9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "requesterPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRightsRequestDto.prototype, "isAuthorizedRep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { name: 'Jane Doe', relationship: 'Guardian', proofDocument: 'doc-url' } }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRightsRequestDto.prototype, "authorizedRepDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I want to access my personal data' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Personal', 'Financial'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRightsRequestDto.prototype, "dataCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['template-uuid-1'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRightsRequestDto.prototype, "relatedConsents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Website', 'Mobile App'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRightsRequestDto.prototype, "relatedApplications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SubmissionChannel, default: 'WEB' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SubmissionChannel),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "submissionChannel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-04-05T00:00:00.000Z', description: 'SLA due date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tenant ID for multi-tenant scoping' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRightsRequestDto.prototype, "tenantId", void 0);
//# sourceMappingURL=create-rights-request.dto.js.map