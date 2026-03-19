"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const sessions_module_1 = require("./sessions/sessions.module");
const invitations_module_1 = require("./invitations/invitations.module");
const access_rules_module_1 = require("./access-rules/access-rules.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const consent_templates_module_1 = require("./consent-templates/consent-templates.module");
const consent_versions_module_1 = require("./consent-versions/consent-versions.module");
const applications_module_1 = require("./applications/applications.module");
const consent_deployments_module_1 = require("./consent-deployments/consent-deployments.module");
const consent_records_module_1 = require("./consent-records/consent-records.module");
const purposes_module_1 = require("./purposes/purposes.module");
const data_categories_module_1 = require("./data-categories/data-categories.module");
const third_parties_module_1 = require("./third-parties/third-parties.module");
const sub_processors_module_1 = require("./sub-processors/sub-processors.module");
const rights_requests_module_1 = require("./rights-requests/rights-requests.module");
const grievances_module_1 = require("./grievances/grievances.module");
const cookies_management_module_1 = require("./cookies-management/cookies-management.module");
const sla_rules_module_1 = require("./sla-rules/sla-rules.module");
const notification_rules_module_1 = require("./notification-rules/notification-rules.module");
const escalation_rules_module_1 = require("./escalation-rules/escalation-rules.module");
const notices_module_1 = require("./notices/notices.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const consent_analytics_module_1 = require("./consent-analytics/consent-analytics.module");
const integrations_module_1 = require("./integrations/integrations.module");
const api_keys_module_1 = require("./api-keys/api-keys.module");
const encryption_module_1 = require("./encryption/encryption.module");
const log_retention_module_1 = require("./log-retention/log-retention.module");
const export_configs_module_1 = require("./export-configs/export-configs.module");
const aadhaar_config_module_1 = require("./aadhaar-config/aadhaar-config.module");
const workflow_configs_module_1 = require("./workflow-configs/workflow-configs.module");
const reports_module_1 = require("./reports/reports.module");
const system_logs_module_1 = require("./system-logs/system-logs.module");
const security_module_1 = require("./security/security.module");
const settings_module_1 = require("./settings/settings.module");
const languages_module_1 = require("./languages/languages.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            sessions_module_1.SessionsModule,
            invitations_module_1.InvitationsModule,
            access_rules_module_1.AccessRulesModule,
            audit_logs_module_1.AuditLogsModule,
            consent_templates_module_1.ConsentTemplatesModule,
            consent_versions_module_1.ConsentVersionsModule,
            applications_module_1.ApplicationsModule,
            consent_deployments_module_1.ConsentDeploymentsModule,
            consent_records_module_1.ConsentRecordsModule,
            purposes_module_1.PurposesModule,
            data_categories_module_1.DataCategoriesModule,
            third_parties_module_1.ThirdPartiesModule,
            sub_processors_module_1.SubProcessorsModule,
            rights_requests_module_1.RightsRequestsModule,
            grievances_module_1.GrievancesModule,
            cookies_management_module_1.CookiesManagementModule,
            sla_rules_module_1.SlaRulesModule,
            notification_rules_module_1.NotificationRulesModule,
            escalation_rules_module_1.EscalationRulesModule,
            notices_module_1.NoticesModule,
            dashboard_module_1.DashboardModule,
            consent_analytics_module_1.ConsentAnalyticsModule,
            integrations_module_1.IntegrationsModule,
            api_keys_module_1.ApiKeysModule,
            encryption_module_1.EncryptionModule,
            log_retention_module_1.LogRetentionModule,
            export_configs_module_1.ExportConfigsModule,
            aadhaar_config_module_1.AadhaarConfigModule,
            workflow_configs_module_1.WorkflowConfigsModule,
            reports_module_1.ReportsModule,
            system_logs_module_1.SystemLogsModule,
            security_module_1.SecurityModule,
            settings_module_1.SettingsModule,
            languages_module_1.LanguagesModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map