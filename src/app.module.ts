import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
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
import { TranslationModule } from './translation/translation.module';
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
import { ReportsModule } from './reports/reports.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { SecurityModule } from './security/security.module';
import { SettingsModule } from './settings/settings.module';
import { LanguagesModule } from './languages/languages.module';
import { AppLoggerModule } from './common/logger/logger.module';
import { HealthModule } from './health/health.module';
import { AppMailerModule } from './common/mailer/mailer.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from './common/storage/storage.module';
import { AadhaarModule } from './aadhaar/aadhaar.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';


import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ([
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ]),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
          }
        }),
      }),
      inject: [ConfigService],
    }),
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
    TranslationModule,
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
    ReportsModule,
    SystemLogsModule,
    SecurityModule,
    SettingsModule,
    LanguagesModule,
    AppLoggerModule,
    HealthModule,
    AppMailerModule,
    NotificationsModule,
    StorageModule,
    AadhaarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
