import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { SlaRulesService } from './sla-rules.service';
import { CreateSlaRuleDto } from './dto/create-sla-rule.dto';
import { UpdateSlaRuleDto } from './dto/update-sla-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, SLAScope, SLARuleStatus, Regulation } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('SLA Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/config/sla-rules')
export class SlaRulesController {
  constructor(private readonly slaRulesService: SlaRulesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create a new SLA rule' })
  create(@Body() dto: CreateSlaRuleDto) {
    return this.slaRulesService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List SLA rules with filters and pagination' })
  @ApiQuery({ name: 'scope', enum: SLAScope, required: false })
  @ApiQuery({ name: 'regulation', enum: Regulation, required: false })
  @ApiQuery({ name: 'status', enum: SLARuleStatus, required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('scope') scope?: SLAScope,
    @Query('regulation') regulation?: Regulation,
    @Query('status') status?: SLARuleStatus,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.slaRulesService.findAll({ scope, regulation, status, tenantId, limit, offset });
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get a specific SLA rule by ID' })
  findOne(@Param('id') id: string) {
    return this.slaRulesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update an SLA rule' })
  update(@Param('id') id: string, @Body() dto: UpdateSlaRuleDto) {
    return this.slaRulesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete an SLA rule' })
  remove(@Param('id') id: string) {
    return this.slaRulesService.remove(id);
  }
}
