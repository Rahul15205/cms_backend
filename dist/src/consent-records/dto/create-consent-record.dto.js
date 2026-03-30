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
exports.CreateConsentRecordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateConsentRecordDto {
    versionId;
    applicationId;
    userId;
    endUserEmail;
    endUserPhone;
    endUserIp;
    status;
    metadata;
}
exports.CreateConsentRecordDto = CreateConsentRecordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-version-id' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "versionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-application-id' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "applicationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-user-id', description: 'Internal platform user ID if known' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'anonymous@example.com', description: 'Email address if tracking external anonymous user' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "endUserEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+919876543210', description: 'Phone number if tracking external anonymous user' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "endUserPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '192.168.1.1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "endUserIp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ConsentStatus, default: client_1.ConsentStatus.GRANTED }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ConsentStatus),
    __metadata("design:type", String)
], CreateConsentRecordDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { deviceAgent: 'Mozilla/5.0...' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateConsentRecordDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-consent-record.dto.js.map