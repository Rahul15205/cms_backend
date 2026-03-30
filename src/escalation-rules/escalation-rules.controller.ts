import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { EscalationRulesService } from './escalation-rules.service';
import { CreateEscalationRuleDto } from './dto/create-escalation-rule.dto';
import { UpdateEscalationRuleDto } from './dto/update-escalation-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, EscalationTrigger, ConfigRuleStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Escalation Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/config/escalation-rules')
export class EscalationRulesController {
  constructor(private readonly escalationRulesService: EscalationRulesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create a new escalation rule' })
  create(@Body() dto: CreateEscalationRuleDto) {
    return this.escalationRulesService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List escalation rules with filters and pagination' })
  @ApiQuery({ name: 'triggerCondition', enum: EscalationTrigger, required: false })
  @ApiQuery({ name: 'status', enum: ConfigRuleStatus, required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('triggerCondition') triggerCondition?: EscalationTrigger,
    @Query('status') status?: ConfigRuleStatus,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.escalationRulesService.findAll({ triggerCondition, status, tenantId, limit, offset });
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get a specific escalation rule by ID' })
  findOne(@Param('id') id: string) {
    return this.escalationRulesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update an escalation rule' })
  update(@Param('id') id: string, @Body() dto: UpdateEscalationRuleDto) {
    return this.escalationRulesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete an escalation rule' })
  remove(@Param('id') id: string) {
    return this.escalationRulesService.remove(id);
  }
}
