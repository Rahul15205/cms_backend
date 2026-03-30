import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, ReportType } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly storageService: StorageService
  ) {}

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
  async download(@Param('id') id: string, @Res() res: Response) {
    const report = await this.reportsService.download(id);

    // Safely retrieve the signed URL targeting the private S3/Supabase bucket
    const signedUrl = await this.storageService.getSignedUrl(report.filePath!);

    // Redirect the user straight to the content delivery network 
    res.redirect(302, signedUrl);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.REPORTS, action: 'admin' })
  @ApiOperation({ summary: 'Delete a generated report' })
  remove(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
