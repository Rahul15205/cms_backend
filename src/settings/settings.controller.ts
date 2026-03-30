import { Controller, Get, Put, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @Permissions({ module: ModuleName.SETTINGS, action: 'view' })
  @ApiOperation({ summary: 'Get tenant/application settings' })
  getSettings(@Request() req: any) {
    return this.settingsService.getSettings(req.user.tenantId);
  }

  @Put()
  @Permissions({ module: ModuleName.SETTINGS, action: 'edit' })
  @ApiOperation({ summary: 'Update tenant/application settings' })
  updateSettings(@Request() req: any, @Body() body: { name?: string; domain?: string; settings?: Record<string, any> }) {
    return this.settingsService.updateSettings(req.user.tenantId, body);
  }
}
