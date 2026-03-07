import { Controller, Get, Put, Body, UseGuards, Query } from '@nestjs/common';
import { AadhaarConfigService } from './aadhaar-config.service';
import { UpdateAadhaarConfigDto } from './dto/update-aadhaar-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - Aadhaar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/config/aadhaar')
export class AadhaarConfigController {
  constructor(private readonly aadhaarConfigService: AadhaarConfigService) {}

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get Aadhaar configuration' })
  getConfig(@Query('tenantId') tenantId: string) {
    return this.aadhaarConfigService.getConfig(tenantId);
  }

  @Put()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update Aadhaar configuration' })
  updateConfig(@Query('tenantId') tenantId: string, @Body() dto: UpdateAadhaarConfigDto) {
    return this.aadhaarConfigService.updateConfig(tenantId, dto);
  }
}
