"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const consent_templates_service_1 = require("./consent-templates.service");
const consent_templates_controller_1 = require("./consent-templates.controller");
let ConsentTemplatesModule = class ConsentTemplatesModule {
};
exports.ConsentTemplatesModule = ConsentTemplatesModule;
exports.ConsentTemplatesModule = ConsentTemplatesModule = __decorate([
    (0, common_1.Module)({
        controllers: [consent_templates_controller_1.ConsentTemplatesController],
        providers: [consent_templates_service_1.ConsentTemplatesService],
    })
], ConsentTemplatesModule);
//# sourceMappingURL=consent-templates.module.js.map