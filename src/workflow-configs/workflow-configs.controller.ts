import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { WorkflowConfigsService } from './workflow-configs.service';
import { CreateWorkflowConfigDto } from './dto/create-workflow-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/config/workflows')
export class WorkflowConfigsController {
  constructor(private readonly workflowConfigsService: WorkflowConfigsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create a workflow configuration' })
  create(@Body() dto: CreateWorkflowConfigDto) {
    return this.workflowConfigsService.create(dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List workflow configurations' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.workflowConfigsService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get a workflow configuration' })
  findOne(@Param('id') id: string) {
    return this.workflowConfigsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update a workflow configuration' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.workflowConfigsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete a workflow configuration' })
  remove(@Param('id') id: string) {
    return this.workflowConfigsService.remove(id);
  }
}
