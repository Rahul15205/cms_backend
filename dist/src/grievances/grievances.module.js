"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrievancesModule = void 0;
const common_1 = require("@nestjs/common");
const encryption_module_1 = require("../encryption/encryption.module");
const notifications_module_1 = require("../notifications/notifications.module");
const grievances_controller_1 = require("./grievances.controller");
const grievances_service_1 = require("./grievances.service");
let GrievancesModule = class GrievancesModule {
};
exports.GrievancesModule = GrievancesModule;
exports.GrievancesModule = GrievancesModule = __decorate([
    (0, common_1.Module)({
        imports: [encryption_module_1.EncryptionModule, notifications_module_1.NotificationsModule],
        controllers: [grievances_controller_1.GrievancesController],
        providers: [grievances_service_1.GrievancesService],
        exports: [grievances_service_1.GrievancesService],
    })
], GrievancesModule);
//# sourceMappingURL=grievances.module.js.map