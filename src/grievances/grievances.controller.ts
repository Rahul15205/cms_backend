import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { UpdateGrievanceDto } from './dto/update-grievance.dto';
import { CreateGrievanceCommentDto } from './dto/create-grievance-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, GrievanceStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Grievances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/grievances')
export class GrievancesController {
  constructor(private readonly grievancesService: GrievancesService) {}

  @Post()
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'create' })
  @ApiOperation({ summary: 'File a new grievance (auto-generates case number GRV-YYYY-NNNN)' })
  create(@Body() dto: CreateGrievanceDto) {
    return this.grievancesService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'view' })
  @ApiOperation({ summary: 'List grievances with pagination and filters' })
  @ApiQuery({ name: 'status', enum: GrievanceStatus, required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('status') status?: GrievanceStatus,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.grievancesService.findAll({ status, category, priority, assignedTo, search, tenantId, limit, offset });
  }

  @Get('metrics')
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'view' })
  @ApiOperation({ summary: 'Get grievance metrics (total, by status, category, priority)' })
  getMetrics() {
    return this.grievancesService.getMetrics();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'view' })
  @ApiOperation({ summary: 'Get grievance details with comments' })
  findOne(@Param('id') id: string) {
    return this.grievancesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'edit' })
  @ApiOperation({ summary: 'Update grievance fields' })
  update(@Param('id') id: string, @Body() dto: UpdateGrievanceDto) {
    return this.grievancesService.update(id, dto);
  }

  @Post(':id/comment')
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'create' })
  @ApiOperation({ summary: 'Add a comment to a grievance' })
  addComment(@Param('id') id: string, @Body() dto: CreateGrievanceCommentDto, @Request() req: any) {
    return this.grievancesService.addComment(id, dto, req.user.userId);
  }

  @Post(':id/escalate')
  @Permissions({ module: ModuleName.GRIEVANCES, action: 'edit' })
  @ApiOperation({ summary: 'Escalate a grievance (validates status transition)' })
  escalate(@Param('id') id: string, @Request() req: any) {
    return this.grievancesService.escalate(id, req.user.userId);
  }
}
