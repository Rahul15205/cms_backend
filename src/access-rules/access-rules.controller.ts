import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AccessRulesService } from './access-rules.service';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Access Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/access-rules')
export class AccessRulesController {
  constructor(private readonly accessRulesService: AccessRulesService) {}

  @Post()
  @Permissions({ module: ModuleName.SECURITY, action: 'create' })
  @ApiOperation({ summary: 'Create a new access rule' })
  create(@Body() createAccessRuleDto: CreateAccessRuleDto, @Request() req: any) {
    return this.accessRulesService.create(createAccessRuleDto, req.user.tenantId);
  }

  @Get()
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'List all access rules' })
  @ApiQuery({ name: 'tenantId', required: false })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.accessRulesService.findAll(tenantId);
  }

  @Get(':id')
  @Permissions({ module: ModuleName.SECURITY, action: 'view' })
  @ApiOperation({ summary: 'Get a specific access rule by ID' })
  findOne(@Param('id') id: string) {
    return this.accessRulesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.SECURITY, action: 'edit' })
  @ApiOperation({ summary: 'Update an access rule' })
  update(@Param('id') id: string, @Body() updateAccessRuleDto: UpdateAccessRuleDto) {
    return this.accessRulesService.update(id, updateAccessRuleDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.SECURITY, action: 'admin' })
  @ApiOperation({ summary: 'Delete an access rule' })
  remove(@Param('id') id: string) {
    return this.accessRulesService.remove(id);
  }
}
