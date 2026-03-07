import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SessionsModule } from './sessions/sessions.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AccessRulesModule } from './access-rules/access-rules.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ConsentTemplatesModule } from './consent-templates/consent-templates.module';
import { ConsentVersionsModule } from './consent-versions/consent-versions.module';
import { ApplicationsModule } from './applications/applications.module';
import { ConsentDeploymentsModule } from './consent-deployments/consent-deployments.module';
import { ConsentRecordsModule } from './consent-records/consent-records.module';
import { PurposesModule } from './purposes/purposes.module';
import { DataCategoriesModule } from './data-categories/data-categories.module';
import { ThirdPartiesModule } from './third-parties/third-parties.module';
import { SubProcessorsModule } from './sub-processors/sub-processors.module';
import { RightsRequestsModule } from './rights-requests/rights-requests.module';
import { GrievancesModule } from './grievances/grievances.module';
import { CookiesManagementModule } from './cookies-management/cookies-management.module';
import { SlaRulesModule } from './sla-rules/sla-rules.module';
import { NotificationRulesModule } from './notification-rules/notification-rules.module';
import { EscalationRulesModule } from './escalation-rules/escalation-rules.module';
import { NoticesModule } from './notices/notices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConsentAnalyticsModule } from './consent-analytics/consent-analytics.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { EncryptionModule } from './encryption/encryption.module';
import { LogRetentionModule } from './log-retention/log-retention.module';
import { ExportConfigsModule } from './export-configs/export-configs.module';
import { AadhaarConfigModule } from './aadhaar-config/aadhaar-config.module';
import { WorkflowConfigsModule } from './workflow-configs/workflow-configs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    InvitationsModule,
    AccessRulesModule,
    AuditLogsModule,
    ConsentTemplatesModule,
    ConsentVersionsModule,
    ApplicationsModule,
    ConsentDeploymentsModule,
    ConsentRecordsModule,
    PurposesModule,
    DataCategoriesModule,
    ThirdPartiesModule,
    SubProcessorsModule,
    RightsRequestsModule,
    GrievancesModule,
    CookiesManagementModule,
    SlaRulesModule,
    NotificationRulesModule,
    EscalationRulesModule,
    NoticesModule,
    DashboardModule,
    ConsentAnalyticsModule,
    IntegrationsModule,
    ApiKeysModule,
    EncryptionModule,
    LogRetentionModule,
    ExportConfigsModule,
    AadhaarConfigModule,
    WorkflowConfigsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
