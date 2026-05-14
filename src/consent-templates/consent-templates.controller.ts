import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ConsentTemplatesService } from './consent-templates.service';
import { CreateConsentTemplateDto } from './dto/create-consent-template.dto';
import { UpdateConsentTemplateDto } from './dto/update-consent-template.dto';
import { ConsentTemplateResponseDto } from './dto/consent-template-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, TemplateStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Consent Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent-templates')
export class ConsentTemplatesController {
  constructor(private readonly consentTemplatesService: ConsentTemplatesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new Consent Template' })
  @ApiResponse({ status: 201, type: ConsentTemplateResponseDto })
  create(@Body() createConsentTemplateDto: CreateConsentTemplateDto, @Request() req: any) {
    return this.consentTemplatesService.create(createConsentTemplateDto, req.user.tenantId, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List Consent Templates' })
  @ApiQuery({ name: 'status', enum: TemplateStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('status') status?: TemplateStatus,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentTemplatesService.findAll({ status, search, tenantId, limit, offset });
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get a specific Consent Template details' })
  @ApiResponse({ status: 200, type: ConsentTemplateResponseDto })
  findOne(@Param('id') id: string) {
    return this.consentTemplatesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update an existing Consent Template' })
  @ApiResponse({ status: 200, type: ConsentTemplateResponseDto })
  update(@Param('id') id: string, @Body() updateConsentTemplateDto: UpdateConsentTemplateDto, @Request() req: any) {
    return this.consentTemplatesService.update(id, updateConsentTemplateDto, req.user.userId);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Archive a Consent Template' })
  remove(@Param('id') id: string) {
    return this.consentTemplatesService.remove(id);
  }
}
