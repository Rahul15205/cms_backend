import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { CreateNoticeTypeDto } from './dto/create-notice-type.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, NoticeStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Notices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // ==========================================
  // NOTICES CRUD
  // ==========================================

  @Post()
  @Permissions({ module: ModuleName.NOTICES, action: 'create' })
  @ApiOperation({ summary: 'Create a new notice (auto-creates v1 snapshot)' })
  create(@Body() dto: CreateNoticeDto, @Request() req: any) {
    return this.noticesService.create({ ...dto, tenantId: req.user.tenantId } as any, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'List notices with filters and pagination' })
  @ApiQuery({ name: 'status', enum: NoticeStatus, required: false })
  @ApiQuery({ name: 'typeId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('status') status?: NoticeStatus,
    @Query('typeId') typeId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any,
  ) {
    const tenantIdToUse = req?.user?.tenantId || tenantId;
    return this.noticesService.findAll({ status, typeId, tenantId: tenantIdToUse, search, limit, offset });
  }

  @Get('languages')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'List available notice languages and their completion status' })
  @ApiQuery({ name: 'tenantId', required: false })
  getLanguages(@Request() req: any, @Query('tenantId') tenantId?: string) {
    const tenantIdToUse = req.user.tenantId || tenantId;
    return this.noticesService.getLanguages(tenantIdToUse);
  }

  @Post('languages')
  @Permissions({ module: ModuleName.NOTICES, action: 'create' })
  @ApiOperation({ summary: 'Add a new notice language' })
  createLanguage(@Body() dto: { code: string; name: string; isDefault?: boolean; tenantId?: string }, @Request() req: any) {
    return this.noticesService.createLanguage({ ...dto, tenantId: req.user.tenantId });
  }

  @Put('languages/:id')
  @Permissions({ module: ModuleName.NOTICES, action: 'edit' })
  @ApiOperation({ summary: 'Update a notice language' })
  updateLanguage(@Param('id') id: string, @Body() dto: { isDefault?: boolean; completion?: number; name?: string }) {
    return this.noticesService.updateLanguage(id, dto);
  }

  @Delete('languages/:id')
  @Permissions({ module: ModuleName.NOTICES, action: 'edit' })
  @ApiOperation({ summary: 'Delete a notice language' })
  deleteLanguage(@Param('id') id: string) {
    return this.noticesService.deleteLanguage(id);
  }

  @Get('types')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'List notice types (e.g., Privacy Policy, Terms of Service)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getTypes(@Request() req: any, @Query('tenantId') tenantId?: string) {
    const tenantIdToUse = req.user.tenantId || tenantId;
    return this.noticesService.getTypes(tenantIdToUse);
  }

  @Post('types')
  @Permissions({ module: ModuleName.NOTICES, action: 'create' })
  @ApiOperation({ summary: 'Create a new notice type' })
  createType(@Body() dto: CreateNoticeTypeDto, @Request() req: any) {
    return this.noticesService.createType({ ...dto, tenantId: req.user.tenantId });
  }

  @Get('history/global')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'Get global version history across all notices' })
  getGlobalHistory() {
    return this.noticesService.getGlobalHistory();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'Get a specific notice with its version history' })
  findOne(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.NOTICES, action: 'edit' })
  @ApiOperation({ summary: 'Update a notice (auto-versions on content/title changes)' })
  update(@Param('id') id: string, @Body() dto: UpdateNoticeDto, @Request() req: any) {
    return this.noticesService.update(id, { ...dto, tenantId: req.user.tenantId } as any, req.user.userId);
  }

  @Get(':id/history')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'Get version history for a specific notice' })
  getHistory(@Param('id') id: string) {
    return this.noticesService.getHistory(id);
  }
}
