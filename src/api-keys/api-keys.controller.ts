import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Config - API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/config/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Generate a new API key' })
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(dto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'List API keys' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.apiKeysService.findAll(tenantId);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Revoke an API key' })
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}
