import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'create' })
  @ApiOperation({ summary: 'Create a new role with permissions' })
  create(@Body() createRoleDto: CreateRoleDto, @Request() req: any) {
    return this.rolesService.create(createRoleDto, req.user.tenantId);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // 1 minute cache
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'List all roles and their permissions' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'Get details of a specific role' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Update a role and resync its permissions' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'admin' })
  @ApiOperation({ summary: 'Delete a non-system role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
