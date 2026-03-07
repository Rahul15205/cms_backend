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
exports.CreateSlaRuleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateSlaRuleDto {
    name;
    regulation;
    rightType;
    category;
    priority;
    duration;
    durationUnit;
    dayType;
    scope;
    pauseConditions;
    autoCloseEnabled;
    breachActions;
    status;
    version;
    tenantId;
}
exports.CreateSlaRuleDto = CreateSlaRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DPDP Access Request SLA' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Regulation, example: 'DPDP' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Regulation),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "regulation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RightsRequestType, example: 'ACCESS', description: 'Only applicable when scope = RIGHTS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RightsRequestType),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "rightType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'DATA_ACCESS', description: 'Grievance category or custom label' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'URGENT' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Duration value for SLA deadline' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSlaRuleDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SLADurationUnit, example: 'DAYS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SLADurationUnit),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "durationUnit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SLADayType, example: 'CALENDAR' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SLADayType),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "dayType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SLAScope, example: 'RIGHTS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SLAScope),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['awaiting_identity_verification', 'on_hold'], description: 'Conditions that pause the SLA clock' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSlaRuleDto.prototype, "pauseConditions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSlaRuleDto.prototype, "autoCloseEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['notify_admin', 'escalate_to_dpo'], description: 'Actions triggered on SLA breach' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSlaRuleDto.prototype, "breachActions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SLARuleStatus, example: 'SLA_ACTIVE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SLARuleStatus),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSlaRuleDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tenant ID for multi-tenant scoping' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSlaRuleDto.prototype, "tenantId", void 0);
//# sourceMappingURL=create-sla-rule.dto.js.map