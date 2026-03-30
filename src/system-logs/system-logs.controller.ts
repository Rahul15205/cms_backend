import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, SystemLogCategory } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('System Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  @Permissions({ module: ModuleName.LOGS, action: 'view' })
  @ApiOperation({ summary: 'List system logs with filtering (consent, rights, security, system, audit, compliance)' })
  @ApiQuery({ name: 'category', enum: SystemLogCategory, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('category') category?: SystemLogCategory,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.systemLogsService.findAll({ category, search, tenantId, startDate, endDate, limit, offset });
  }

  @Get('export')
  @Permissions({ module: ModuleName.LOGS, action: 'export' })
  @ApiOperation({ summary: 'Export filtered system logs' })
  @ApiQuery({ name: 'category', enum: SystemLogCategory, required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  exportLogs(
    @Query('category') category?: SystemLogCategory,
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.systemLogsService.exportLogs({ category, tenantId, startDate, endDate });
  }
}
