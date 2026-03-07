import { Controller, Get, Put, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { UpdateEncryptionConfigDto } from './dto/update-encryption-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - Encryption')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/config/encryption')
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Get encryption configuration' })
  getConfig(@Query('tenantId') tenantId: string) {
    return this.encryptionService.getConfig(tenantId);
  }

  @Put()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update encryption configuration' })
  updateConfig(@Query('tenantId') tenantId: string, @Body() dto: UpdateEncryptionConfigDto) {
    return this.encryptionService.updateConfig(tenantId, dto);
  }

  @Post('rotate')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Rotate encryption keys' })
  rotateKey(@Query('tenantId') tenantId: string) {
    return this.encryptionService.rotateKey(tenantId);
  }
}
