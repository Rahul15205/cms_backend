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
exports.CreateCookieBannerDto = exports.BannerStatus = exports.BannerPosition = void 0;
const class_validator_1 = require("class-validator");
var BannerPosition;
(function (BannerPosition) {
    BannerPosition["BOTTOM"] = "BOTTOM";
    BannerPosition["TOP"] = "TOP";
    BannerPosition["CENTER"] = "CENTER";
    BannerPosition["CORNER"] = "CORNER";
})(BannerPosition || (exports.BannerPosition = BannerPosition = {}));
var BannerStatus;
(function (BannerStatus) {
    BannerStatus["DRAFT"] = "DRAFT";
    BannerStatus["ACTIVE"] = "ACTIVE";
})(BannerStatus || (exports.BannerStatus = BannerStatus = {}));
class CreateCookieBannerDto {
    name;
    theme;
    language;
    position;
    status;
}
exports.CreateCookieBannerDto = CreateCookieBannerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCookieBannerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCookieBannerDto.prototype, "theme", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCookieBannerDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(BannerPosition),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCookieBannerDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(BannerStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCookieBannerDto.prototype, "status", void 0);
//# sourceMappingURL=create-cookie-banner.dto.js.map