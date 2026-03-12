import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, IntegrationType, IntegrationStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'create' })
  @ApiOperation({ summary: 'Register a new integration' })
  create(@Body() dto: CreateIntegrationDto) {
    return this.integrationsService.create(dto);
  }

  @Get('metrics')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get integration metrics and trends' })
  getMetrics() {
    return this.integrationsService.getMetrics();
  }

  @Get()
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'view' })
  @ApiOperation({ summary: 'List integrations with filters' })
  @ApiQuery({ name: 'type', enum: IntegrationType, required: false })
  @ApiQuery({ name: 'status', enum: IntegrationStatus, required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('type') type?: IntegrationType,
    @Query('status') status?: IntegrationStatus,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.integrationsService.findAll({ type, status, tenantId, limit, offset });
  }

  @Get(':id')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get integration details with recent sync logs' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update integration config' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    return this.integrationsService.update(id, dto);
  }

  @Post(':id/connect')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Connect an integration' })
  connect(@Param('id') id: string) {
    return this.integrationsService.connect(id);
  }

  @Post(':id/disconnect')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Disconnect an integration' })
  disconnect(@Param('id') id: string) {
    return this.integrationsService.disconnect(id);
  }

  @Post(':id/sync')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Trigger a manual sync for an integration' })
  sync(@Param('id') id: string) {
    return this.integrationsService.sync(id);
  }

  @Get(':id/logs')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get sync logs for an integration' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getSyncLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.integrationsService.getSyncLogs(id, limit ? Number(limit) : 20);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.INTEGRATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Remove an integration' })
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }
}
