import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ConsentAnalyticsService } from './consent-analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, ConsentUsageStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Consent Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent')
export class ConsentAnalyticsController {
  constructor(private readonly consentAnalyticsService: ConsentAnalyticsService) {}

  @Get('usage-records')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List consent usage records (per-user consent tracking)' })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({ name: 'status', enum: ConsentUsageStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  getUsageRecords(
    @Query('templateId') templateId?: string,
    @Query('status') status?: ConsentUsageStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentAnalyticsService.getUsageRecords({ templateId, status, search, limit, offset });
  }

  @Get('cross-app-usage')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List cross-application consent usage' })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  getCrossAppUsage(
    @Query('templateId') templateId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentAnalyticsService.getCrossAppUsage({ templateId, status, limit, offset });
  }

  @Get('analytics')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get aggregate consent analytics (templates, records, deployments, cross-app)' })
  getAnalytics() {
    return this.consentAnalyticsService.getAnalytics();
  }

  @Get('system-configs')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List system configs for usage traceability' })
  @ApiQuery({ name: 'tenantId', required: false })
  getSystemConfigs(@Query('tenantId') tenantId?: string) {
    return this.consentAnalyticsService.getSystemConfigs(tenantId);
  }

  @Post('system-configs')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a system config for usage traceability' })
  createSystemConfig(@Body() dto: { name: string; type: string; integrationMode: string; authMethod: string; endpoint: string; description?: string; tenantId?: string }) {
    return this.consentAnalyticsService.createSystemConfig(dto);
  }
}
