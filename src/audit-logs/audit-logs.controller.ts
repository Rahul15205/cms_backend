import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, AuditCategory, AuditSeverity } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions({ module: ModuleName.LOGS, action: 'view' })
  @ApiOperation({ summary: 'Get paginated and filtered application audit logs' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'category', enum: AuditCategory, required: false })
  @ApiQuery({ name: 'severity', enum: AuditSeverity, required: false })
  @ApiQuery({ name: 'startDate', type: Date, required: false })
  @ApiQuery({ name: 'endDate', type: Date, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Default: 10' })
  @ApiQuery({ name: 'anonymize', type: Boolean, required: false, description: 'Anonymize/Mask PII fields in logs' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('category') category?: AuditCategory,
    @Query('severity') severity?: AuditSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('anonymize') anonymize?: string,
  ) {
    const limitNum = limit ? Number(limit) : 10;
    const pageNum = page ? Number(page) : 1;
    const isAnonymize = anonymize === 'true' || anonymize === '1';

    const { data, total } = await this.auditLogsService.findAll({
      tenantId, userId, category, severity, startDate, endDate, 
      limit: limitNum, 
      page: pageNum,
      anonymize: isAnonymize
    });

    return {
      total,
      data,
      page: pageNum,
      limit: limitNum
    };
  }
}
