import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ExportConfigsService } from './export-configs.service';
import { CreateExportConfigDto } from './dto/create-export-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/config/export')
export class ExportConfigsController {
  constructor(private readonly exportConfigsService: ExportConfigsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create an export configuration' })
  create(@Body() dto: CreateExportConfigDto) {
    return this.exportConfigsService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List export configurations' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.exportConfigsService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get an export configuration' })
  findOne(@Param('id') id: string) {
    return this.exportConfigsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update an export configuration' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.exportConfigsService.update(id, dto);
  }

  @Post(':id/execute')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Execute export report now' })
  executeNow(@Param('id') id: string) {
    return this.exportConfigsService.executeNow(id);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete an export configuration' })
  remove(@Param('id') id: string) {
    return this.exportConfigsService.remove(id);
  }
}
