import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('events')
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'List security events from audit logs' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  getEvents(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.securityService.getEvents(tenantId, limit, offset);
  }

  @Get('login-activity')
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'Get login activity chart data (logins per day)' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'days', type: Number, required: false, description: 'Number of days to look back (default: 30)' })
  getLoginActivity(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: number,
  ) {
    return this.securityService.getLoginActivity(tenantId, days);
  }

  @Get('sessions')
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'List active sessions with user info' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getActiveSessions(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.securityService.getActiveSessions(tenantId, limit);
  }
}
