import { Controller, Get, Put, Param, Body, UseGuards, Query, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'view' })
  @ApiOperation({ summary: 'Get aggregate KPIs across all modules (consents, rights, grievances, users, SLA)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getKpis(@Query('tenantId') tenantId?: string) {
    return this.dashboardService.getKpis(tenantId);
  }

  @Get('charts/:type')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'view' })
  @ApiOperation({ summary: 'Get chart data by type (consent-status, rights-by-status, rights-by-type, grievances-by-category, grievances-by-status, users-by-status)' })
  @ApiParam({ name: 'type', example: 'consent-status' })
  @ApiQuery({ name: 'tenantId', required: false })
  getChartData(@Param('type') type: string, @Query('tenantId') tenantId?: string) {
    return this.dashboardService.getChartData(type, tenantId);
  }

  @Get('recent-activity')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'view' })
  @ApiOperation({ summary: 'Get recent audit log activity' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getRecentActivity(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getRecentActivity(tenantId, limit ? Number(limit) : 20);
  }

  @Get('alerts')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'view' })
  @ApiOperation({ summary: 'Get active alerts (SLA breaches, escalated grievances, stale sessions)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getAlerts(@Query('tenantId') tenantId?: string) {
    return this.dashboardService.getAlerts(tenantId);
  }

  @Get('security')
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'Get security dashboard KPIs (sessions, MFA %, failed logins, threat level)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getSecurityKpis(@Query('tenantId') tenantId?: string) {
    return this.dashboardService.getSecurityKpis(tenantId);
  }

  @Get('widget-config')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'view' })
  @ApiOperation({ summary: 'Get current user widget configuration' })
  getWidgetConfig(@Request() req: any) {
    return this.dashboardService.getWidgetConfig(req.user.userId);
  }

  @Put('widget-config')
  @Permissions({ module: ModuleName.DASHBOARD, action: 'edit' })
  @ApiOperation({ summary: 'Save user widget configuration' })
  updateWidgetConfig(@Request() req: any, @Body() body: { widgets: any }) {
    return this.dashboardService.updateWidgetConfig(req.user.userId, body.widgets);
  }
}
