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
exports.CreateEscalationRuleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateEscalationRuleDto {
    name;
    triggerCondition;
    triggerThreshold;
    escalationLevel;
    recipientRole;
    recipientUser;
    action;
    maxLevels;
    autoCloseOnResolution;
    status;
    tenantId;
}
exports.CreateEscalationRuleDto = CreateEscalationRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SLA Breach Auto-Escalation' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EscalationTrigger, example: 'SLA_BREACH' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EscalationTrigger),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "triggerCondition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 24, description: 'Threshold value (e.g., hours past SLA, risk score)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEscalationRuleDto.prototype, "triggerThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EscalationLevel, example: 'L1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EscalationLevel),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "escalationLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DPO', description: 'Role name to escalate to' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "recipientRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Specific user ID to escalate to (optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "recipientUser", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EscalationAction, example: 'NOTIFY' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EscalationAction),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, description: 'Maximum escalation levels' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateEscalationRuleDto.prototype, "maxLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEscalationRuleDto.prototype, "autoCloseOnResolution", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ConfigRuleStatus, example: 'CFG_ACTIVE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ConfigRuleStatus),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tenant ID for multi-tenant scoping' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEscalationRuleDto.prototype, "tenantId", void 0);
//# sourceMappingURL=create-escalation-rule.dto.js.map