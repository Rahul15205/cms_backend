import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { DataCategoriesService } from './data-categories.service';
import { CreateDataCategoryDto } from './dto/create-data-category.dto';
import { UpdateDataCategoryDto } from './dto/update-data-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Data Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/data-categories')
export class DataCategoriesController {
  constructor(private readonly dataCategoriesService: DataCategoriesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new data category' })
  create(@Body() createDataCategoryDto: CreateDataCategoryDto) {
    return this.dataCategoriesService.create(createDataCategoryDto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve all data categories' })
  findAll() {
    return this.dataCategoriesService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve a data category by id' })
  findOne(@Param('id') id: string) {
    return this.dataCategoriesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a data category by id' })
  update(@Param('id') id: string, @Body() updateDataCategoryDto: UpdateDataCategoryDto) {
    return this.dataCategoriesService.update(id, updateDataCategoryDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Remove a data category by id' })
  remove(@Param('id') id: string) {
    return this.dataCategoriesService.remove(id);
  }
}
