import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Register a new Application Integration (generates API Key)' })
  @ApiResponse({ status: 201, type: ApplicationResponseDto })
  create(@Body() createApplicationDto: CreateApplicationDto, @Request() req: any) {
    return this.applicationsService.create(createApplicationDto, req.user.tenantId);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List managed Applications' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.applicationsService.findAll(tenantId, search, limit, offset);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get Application details' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update Application configuration' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Put(':id/roll-key')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Rotate the API Key for this Application' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  rollApiKey(@Param('id') id: string) {
    return this.applicationsService.rollApiKey(id);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Delete an Application Integration forever' })
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}
