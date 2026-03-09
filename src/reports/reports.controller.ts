import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, ReportType } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Permissions({ module: ModuleName.REPORTS, action: 'create' })
  @ApiOperation({ summary: 'Generate a new report' })
  create(@Body() dto: CreateReportDto, @Request() req: any) {
    return this.reportsService.create(dto, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.REPORTS, action: 'view' })
  @ApiOperation({ summary: 'List all generated reports' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'reportType', enum: ReportType, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  findAll(
    @Query('tenantId') tenantId?: string,
    @Query('reportType') reportType?: ReportType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.reportsService.findAll(tenantId, reportType, limit, offset);
  }

  @Get(':id/download')
  @Permissions({ module: ModuleName.REPORTS, action: 'export' })
  @ApiOperation({ summary: 'Download a generated report' })
  download(@Param('id') id: string) {
    return this.reportsService.download(id);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.REPORTS, action: 'admin' })
  @ApiOperation({ summary: 'Delete a generated report' })
  remove(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
