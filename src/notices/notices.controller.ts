import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, Request } from '@nestjs/common';
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
@Controller('api/notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // ==========================================
  // NOTICES CRUD
  // ==========================================

  @Post()
  @Permissions({ module: ModuleName.NOTICES, action: 'create' })
  @ApiOperation({ summary: 'Create a new notice (auto-creates v1 snapshot)' })
  create(@Body() dto: CreateNoticeDto, @Request() req: any) {
    return this.noticesService.create(dto, req.user.userId);
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
  ) {
    return this.noticesService.findAll({ status, typeId, tenantId, search, limit, offset });
  }

  @Get('languages')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'List available notice languages and their completion status' })
  @ApiQuery({ name: 'tenantId', required: false })
  getLanguages(@Query('tenantId') tenantId?: string) {
    return this.noticesService.getLanguages(tenantId);
  }

  @Get('types')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'List notice types (e.g., Privacy Policy, Terms of Service)' })
  @ApiQuery({ name: 'tenantId', required: false })
  getTypes(@Query('tenantId') tenantId?: string) {
    return this.noticesService.getTypes(tenantId);
  }

  @Post('types')
  @Permissions({ module: ModuleName.NOTICES, action: 'create' })
  @ApiOperation({ summary: 'Create a new notice type' })
  createType(@Body() dto: CreateNoticeTypeDto) {
    return this.noticesService.createType(dto);
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
    return this.noticesService.update(id, dto, req.user.userId);
  }

  @Get(':id/history')
  @Permissions({ module: ModuleName.NOTICES, action: 'view' })
  @ApiOperation({ summary: 'Get version history for a specific notice' })
  getHistory(@Param('id') id: string) {
    return this.noticesService.getHistory(id);
  }
}
