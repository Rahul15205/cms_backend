import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { LogRetentionService } from './log-retention.service';
import { CreateLogRetentionRuleDto } from './dto/create-log-retention-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - Log Retention')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/config/log-retention')
export class LogRetentionController {
  constructor(private readonly logRetentionService: LogRetentionService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create a log retention rule' })
  create(@Body() dto: CreateLogRetentionRuleDto) {
    return this.logRetentionService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List log retention rules' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.logRetentionService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get a log retention rule' })
  findOne(@Param('id') id: string) {
    return this.logRetentionService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update a log retention rule' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.logRetentionService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete a log retention rule' })
  remove(@Param('id') id: string) {
    return this.logRetentionService.remove(id);
  }
}
