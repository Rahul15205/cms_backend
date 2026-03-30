"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookiesManagementModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const cookies_management_controller_1 = require("./cookies-management.controller");
const cookies_management_service_1 = require("./cookies-management.service");
const prisma_module_1 = require("../prisma/prisma.module");
const cookie_scanner_processor_1 = require("./cookie-scanner.processor");
let CookiesManagementModule = class CookiesManagementModule {
};
exports.CookiesManagementModule = CookiesManagementModule;
exports.CookiesManagementModule = CookiesManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bullmq_1.BullModule.registerQueue({ name: 'cookie-scanner' }),
        ],
        controllers: [cookies_management_controller_1.CookiesManagementController],
        providers: [cookies_management_service_1.CookiesManagementService, cookie_scanner_processor_1.CookieScannerProcessor],
        exports: [cookies_management_service_1.CookiesManagementService],
    })
], CookiesManagementModule);
//# sourceMappingURL=cookies-management.module.js.map