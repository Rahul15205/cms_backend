import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Languages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'create' })
  @ApiOperation({ summary: 'Create a new language' })
  create(@Body() data: any) {
    return this.languagesService.create(data);
  }

  @Get()
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Retrieve all languages' })
  findAll() {
    return this.languagesService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'view' })
  @ApiOperation({ summary: 'Retrieve a language by id' })
  findOne(@Param('id') id: string) {
    return this.languagesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'edit' })
  @ApiOperation({ summary: 'Update a language by id' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.languagesService.update(id, data);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONFIGURATIONS, action: 'admin' })
  @ApiOperation({ summary: 'Remove a language by id' })
  remove(@Param('id') id: string) {
    return this.languagesService.remove(id);
  }
}
