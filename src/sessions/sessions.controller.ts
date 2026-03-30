import { Controller, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  findAll(@Request() req: any) {
    return this.sessionsService.findAllForUser(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.remove(id, req.user.userId);
  }
}
