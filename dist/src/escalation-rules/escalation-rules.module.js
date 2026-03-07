"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationRulesModule = void 0;
const common_1 = require("@nestjs/common");
const escalation_rules_controller_1 = require("./escalation-rules.controller");
const escalation_rules_service_1 = require("./escalation-rules.service");
let EscalationRulesModule = class EscalationRulesModule {
};
exports.EscalationRulesModule = EscalationRulesModule;
exports.EscalationRulesModule = EscalationRulesModule = __decorate([
    (0, common_1.Module)({
        controllers: [escalation_rules_controller_1.EscalationRulesController],
        providers: [escalation_rules_service_1.EscalationRulesService],
        exports: [escalation_rules_service_1.EscalationRulesService],
    })
], EscalationRulesModule);
//# sourceMappingURL=escalation-rules.module.js.map