"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RightsRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const encryption_module_1 = require("../encryption/encryption.module");
const notifications_module_1 = require("../notifications/notifications.module");
const rights_requests_controller_1 = require("./rights-requests.controller");
const rights_requests_service_1 = require("./rights-requests.service");
const sla_monitor_processor_1 = require("./sla-monitor.processor");
const erasure_processor_1 = require("./erasure.processor");
const prisma_module_1 = require("../prisma/prisma.module");
const reports_module_1 = require("../reports/reports.module");
let RightsRequestsModule = class RightsRequestsModule {
};
exports.RightsRequestsModule = RightsRequestsModule;
exports.RightsRequestsModule = RightsRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            encryption_module_1.EncryptionModule,
            notifications_module_1.NotificationsModule,
            reports_module_1.ReportsModule,
            bullmq_1.BullModule.registerQueue({ name: 'sla-monitor' }, { name: 'erasure' }),
        ],
        controllers: [rights_requests_controller_1.RightsRequestsController],
        providers: [rights_requests_service_1.RightsRequestsService, sla_monitor_processor_1.SlaMonitorProcessor, erasure_processor_1.ErasureProcessor],
        exports: [rights_requests_service_1.RightsRequestsService],
    })
], RightsRequestsModule);
//# sourceMappingURL=rights-requests.module.js.map