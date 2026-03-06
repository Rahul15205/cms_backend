"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentVersionsModule = void 0;
const common_1 = require("@nestjs/common");
const consent_versions_service_1 = require("./consent-versions.service");
const consent_versions_controller_1 = require("./consent-versions.controller");
let ConsentVersionsModule = class ConsentVersionsModule {
};
exports.ConsentVersionsModule = ConsentVersionsModule;
exports.ConsentVersionsModule = ConsentVersionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [consent_versions_controller_1.ConsentVersionsController],
        providers: [consent_versions_service_1.ConsentVersionsService],
    })
], ConsentVersionsModule);
//# sourceMappingURL=consent-versions.module.js.map