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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
