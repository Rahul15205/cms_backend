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
exports.CreateCookieCategoryDto = exports.CookieCategoryType = void 0;
const class_validator_1 = require("class-validator");
var CookieCategoryType;
(function (CookieCategoryType) {
    CookieCategoryType["NECESSARY"] = "NECESSARY";
    CookieCategoryType["ANALYTICS"] = "ANALYTICS";
    CookieCategoryType["FUNCTIONAL"] = "FUNCTIONAL";
    CookieCategoryType["ADVERTISING"] = "ADVERTISING";
    CookieCategoryType["UNCATEGORIZED"] = "UNCATEGORIZED";
})(CookieCategoryType || (exports.CookieCategoryType = CookieCategoryType = {}));
class CreateCookieCategoryDto {
    name;
    category;
    description;
    enabled;
    locked;
}
exports.CreateCookieCategoryDto = CreateCookieCategoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCookieCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CookieCategoryType),
    __metadata("design:type", String)
], CreateCookieCategoryDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCookieCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCookieCategoryDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateCookieCategoryDto.prototype, "locked", void 0);
//# sourceMappingURL=create-cookie-category.dto.js.map