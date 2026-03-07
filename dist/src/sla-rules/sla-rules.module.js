"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaRulesModule = void 0;
const common_1 = require("@nestjs/common");
const sla_rules_controller_1 = require("./sla-rules.controller");
const sla_rules_service_1 = require("./sla-rules.service");
let SlaRulesModule = class SlaRulesModule {
};
exports.SlaRulesModule = SlaRulesModule;
exports.SlaRulesModule = SlaRulesModule = __decorate([
    (0, common_1.Module)({
        controllers: [sla_rules_controller_1.SlaRulesController],
        providers: [sla_rules_service_1.SlaRulesService],
        exports: [sla_rules_service_1.SlaRulesService],
    })
], SlaRulesModule);
//# sourceMappingURL=sla-rules.module.js.map