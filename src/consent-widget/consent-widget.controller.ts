import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ConsentWidgetService } from './consent-widget.service';
import { CreateConsentWidgetDto } from './dto/create-consent-widget.dto';
import { UpdateConsentWidgetDto } from './dto/update-consent-widget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Consent Widgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent-widgets')
export class ConsentWidgetController {
  constructor(private readonly widgetService: ConsentWidgetService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new embeddable consent widget configuration' })
  create(@Body() dto: CreateConsentWidgetDto, @Request() req) {
    return this.widgetService.create(dto, req.user.tenantId, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List all consent widget configurations' })
  findAll(@Request() req) {
    return this.widgetService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get a specific consent widget configuration' })
  findOne(@Param('id') id: string) {
    return this.widgetService.findOne(id);
  }

  @Get(':id/analytics')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get analytics for a specific consent widget' })
  getAnalytics(@Param('id') id: string) {
    return this.widgetService.getWidgetAnalytics(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a consent widget configuration' })
  update(@Param('id') id: string, @Body() dto: UpdateConsentWidgetDto, @Request() req) {
    return this.widgetService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Archive a consent widget configuration' })
  remove(@Param('id') id: string, @Request() req) {
    return this.widgetService.remove(id, req.user.tenantId);
  }
}
