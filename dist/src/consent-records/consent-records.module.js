"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentRecordsModule = void 0;
const common_1 = require("@nestjs/common");
const consent_records_service_1 = require("./consent-records.service");
const consent_records_controller_1 = require("./consent-records.controller");
let ConsentRecordsModule = class ConsentRecordsModule {
};
exports.ConsentRecordsModule = ConsentRecordsModule;
exports.ConsentRecordsModule = ConsentRecordsModule = __decorate([
    (0, common_1.Module)({
        controllers: [consent_records_controller_1.ConsentRecordsController],
        providers: [consent_records_service_1.ConsentRecordsService],
    })
], ConsentRecordsModule);
//# sourceMappingURL=consent-records.module.js.map