import { Controller, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'List sessions for the tenant (User Setup)' })
  findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (tenantId) {
      return this.sessionsService.findAllForTenant(tenantId);
    }
    return this.sessionsService.findAllForUser(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.remove(id, req.user.userId);
  }
}
