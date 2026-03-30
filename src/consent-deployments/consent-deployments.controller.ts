import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ConsentDeploymentsService } from './consent-deployments.service';
import { CreateConsentDeploymentDto } from './dto/create-consent-deployment.dto';
import { UpdateConsentDeploymentDto } from './dto/update-consent-deployment.dto';
import { ConsentDeploymentResponseDto } from './dto/consent-deployment-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Consent Deployments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/consent-deployments')
export class ConsentDeploymentsController {
  constructor(private readonly consentDeploymentsService: ConsentDeploymentsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Deploy a Consent Version to an Application' })
  @ApiResponse({ status: 201, type: ConsentDeploymentResponseDto })
  create(@Body() createConsentDeploymentDto: CreateConsentDeploymentDto, @Request() req: any) {
    return this.consentDeploymentsService.create(createConsentDeploymentDto, req.user.userId);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'List all deployments' })
  @ApiQuery({ name: 'applicationId', required: false })
  @ApiQuery({ name: 'versionId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('applicationId') applicationId?: string,
    @Query('versionId') versionId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.consentDeploymentsService.findAll(applicationId, versionId, limit, offset);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get details of a specific deployment (includes logs)' })
  @ApiResponse({ status: 200, type: ConsentDeploymentResponseDto })
  findOne(@Param('id') id: string) {
    return this.consentDeploymentsService.findOne(id);
  }

  @Get(':id/logs')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Get deployment logs for a specific deployment' })
  getLogs(@Param('id') id: string) {
    return this.consentDeploymentsService.getDeploymentLogs(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update deployment configuration (e.g. toggle isActive, region, segment)' })
  @ApiResponse({ status: 200, type: ConsentDeploymentResponseDto })
  update(@Param('id') id: string, @Body() updateConsentDeploymentDto: UpdateConsentDeploymentDto) {
    return this.consentDeploymentsService.update(id, updateConsentDeploymentDto);
  }

  @Put(':id/rollback')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'approve' })
  @ApiOperation({ summary: 'Rollback a deployment (sets status to ROLLED_BACK and deactivates)' })
  rollback(@Param('id') id: string, @Request() req: any) {
    return this.consentDeploymentsService.rollback(id, req.user.userId);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Remove a deployment binding entirely' })
  remove(@Param('id') id: string) {
    return this.consentDeploymentsService.remove(id);
  }
}
