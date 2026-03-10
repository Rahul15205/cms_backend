import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request } from '@nestjs/common';
import { RightsRequestsService } from './rights-requests.service';
import { CreateRightsRequestDto } from './dto/create-rights-request.dto';
import { UpdateRightsRequestDto } from './dto/update-rights-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { CreateCaseAttachmentDto } from './dto/create-case-attachment.dto';
import { CreateEvidenceItemDto } from './dto/create-evidence-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, RightsRequestStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Rights Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/rights')
export class RightsRequestsController {
  constructor(private readonly rightsRequestsService: RightsRequestsService) {}

  // ==========================================
  // PHASE 2: Core CRUD (4 endpoints)
  // ==========================================

  @Post('requests')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new rights request (auto-generates case number + workflow)' })
  create(@Body() dto: CreateRightsRequestDto, @Request() req: any) {
    return this.rightsRequestsService.create(dto, req.user.userId);
  }

  @Get('requests')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List rights requests with pagination and filters' })
  @ApiQuery({ name: 'status', enum: RightsRequestStatus, required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('status') status?: RightsRequestStatus,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.rightsRequestsService.findAll({ status, type, priority, assignedTo, search, tenantId, limit, offset });
  }

  @Get('requests/:id')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get full details of a rights request (with workflow steps)' })
  findOne(@Param('id') id: string) {
    return this.rightsRequestsService.findOne(id);
  }

  @Put('requests/:id')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update mutable fields of a rights request' })
  update(@Param('id') id: string, @Body() dto: UpdateRightsRequestDto) {
    return this.rightsRequestsService.update(id, dto);
  }

  // ==========================================
  // PHASE 3: Workflow Engine (3 endpoints)
  // ==========================================

  @Put('requests/:id/status')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Transition request status (validated state machine)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Request() req: any) {
    return this.rightsRequestsService.updateStatus(id, dto, req.user.userId);
  }

  @Put('requests/:id/assign')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Assign request to a user or team' })
  assign(@Param('id') id: string, @Body() dto: AssignRequestDto, @Request() req: any) {
    return this.rightsRequestsService.assign(id, dto, req.user.userId);
  }

  @Get('requests/:id/workflow')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get workflow steps for a request' })
  getWorkflow(@Param('id') id: string) {
    return this.rightsRequestsService.getWorkflow(id);
  }

  // ==========================================
  // PHASE 4: Sub-resources (7 endpoints)
  // ==========================================

  @Get('requests/:id/notes')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List case notes for a request' })
  getNotes(@Param('id') id: string) {
    return this.rightsRequestsService.getNotes(id);
  }

  @Post('requests/:id/notes')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Add a case note (internal or external)' })
  addNote(@Param('id') id: string, @Body() dto: CreateCaseNoteDto, @Request() req: any) {
    return this.rightsRequestsService.addNote(id, dto, req.user.userId);
  }

  @Get('requests/:id/attachments')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List attachments for a request' })
  getAttachments(@Param('id') id: string) {
    return this.rightsRequestsService.getAttachments(id);
  }

  @Post('requests/:id/attachments')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Add an attachment to a request' })
  addAttachment(@Param('id') id: string, @Body() dto: CreateCaseAttachmentDto, @Request() req: any) {
    return this.rightsRequestsService.addAttachment(id, dto, req.user.userId);
  }

  @Get('requests/:id/evidence')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List evidence items for a request' })
  getEvidence(@Param('id') id: string) {
    return this.rightsRequestsService.getEvidence(id);
  }

  @Post('requests/:id/evidence')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Add an evidence item' })
  addEvidence(@Param('id') id: string, @Body() dto: CreateEvidenceItemDto, @Request() req: any) {
    return this.rightsRequestsService.addEvidence(id, dto, req.user.userId);
  }

  @Get('requests/:id/audit')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get full audit trail for a request' })
  getAuditTrail(@Param('id') id: string) {
    return this.rightsRequestsService.getAuditTrail(id);
  }

  @Get('evidence')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List all evidence items across all requests' })
  getAllEvidence() {
    return this.rightsRequestsService.getAllEvidence();
  }

  @Get('audit')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get global audit trail across all requests' })
  getGlobalAuditTrail() {
    return this.rightsRequestsService.getGlobalAuditTrail();
  }

  // ==========================================
  // PHASE 5: Metrics & Analytics (2 endpoints)
  // ==========================================

  @Get('metrics')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get aggregate metrics (total, by status, SLA breaches, avg resolution)' })
  getMetrics() {
    return this.rightsRequestsService.getMetrics();
  }

  @Get('analytics')
  @Permissions({ module: ModuleName.RIGHTS_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get analytics trends (monthly trend, by regulation, by channel, verification methods, top data categories)' })
  getAnalytics() {
    return this.rightsRequestsService.getAnalytics();
  }
}
