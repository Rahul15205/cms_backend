import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { ConsentRecordsService } from './consent-records.service';
import { CreateConsentRecordDto } from './dto/create-consent-record.dto';
import { UpdateConsentRecordDto } from './dto/update-consent-record.dto';
import { ConsentRecordResponseDto } from './dto/consent-record-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, ConsentStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

// Note: Usually ingestion might be protected purely by an `ApiKeyGuard` instead of JWT for machine-to-machine calls. 
// For now, it leverages the standard JWT layer per MVP constraints, expecting internal apps to pass tokens natively.

@ApiTags('Consent Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent-records')
export class ConsentRecordsController {
  constructor(private readonly consentRecordsService: ConsentRecordsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Ingest a new Consent Agreement Record from an End User' })
  @ApiResponse({ status: 201, type: ConsentRecordResponseDto })
  create(@Body() createConsentRecordDto: CreateConsentRecordDto) {
    return this.consentRecordsService.create(createConsentRecordDto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List and filter Consent Records natively' })
  @ApiQuery({ name: 'status', enum: ConsentStatus, required: false })
  @ApiQuery({ name: 'versionId', required: false })
  @ApiQuery({ name: 'applicationId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('status') status?: ConsentStatus,
    @Query('versionId') versionId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('userId') userId?: string,
    @Query('email') email?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentRecordsService.findAll(status, versionId, applicationId, userId, email, limit, offset);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Inspect a specific Consent Record detail strictly' })
  @ApiResponse({ status: 200, type: ConsentRecordResponseDto })
  findOne(@Param('id') id: string) {
    return this.consentRecordsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a Consent Record (i.e. to register a REVOKED signal)' })
  @ApiResponse({ status: 200, type: ConsentRecordResponseDto })
  update(@Param('id') id: string, @Body() updateConsentRecordDto: UpdateConsentRecordDto) {
    return this.consentRecordsService.update(id, updateConsentRecordDto);
  }

  // Records should be entirely immutable against deletion for compliance. DELETE route explicitly omitted.
}
