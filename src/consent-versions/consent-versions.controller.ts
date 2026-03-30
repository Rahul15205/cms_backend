import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { ConsentVersionsService } from './consent-versions.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
import { ConsentVersionResponseDto } from './dto/consent-version-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Consent Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent-versions')
export class ConsentVersionsController {
  constructor(private readonly consentVersionsService: ConsentVersionsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Publish a new Consent Version (freezes template content)' })
  @ApiResponse({ status: 201, type: ConsentVersionResponseDto })
  create(@Body() createConsentVersionDto: CreateConsentVersionDto, @Request() req: any) {
    return this.consentVersionsService.create(createConsentVersionDto, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List Consent Versions historically' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filter versions by their parent template' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('templateId') templateId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentVersionsService.findAll(templateId, limit, offset);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get a specific Consent Version snapshot structurally' })
  @ApiResponse({ status: 200, type: ConsentVersionResponseDto })
  findOne(@Param('id') id: string) {
    return this.consentVersionsService.findOne(id);
  }
}
