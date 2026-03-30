import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SubProcessorsService } from './sub-processors.service';
import { CreateSubProcessorDto } from './dto/create-sub-processor.dto';
import { UpdateSubProcessorDto } from './dto/update-sub-processor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sub Processors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sub-processors')
export class SubProcessorsController {
  constructor(private readonly subProcessorsService: SubProcessorsService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new sub-processor' })
  create(@Body() createSubProcessorDto: CreateSubProcessorDto) {
    return this.subProcessorsService.create(createSubProcessorDto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve all sub-processors' })
  findAll() {
    return this.subProcessorsService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve a sub-processor by id' })
  findOne(@Param('id') id: string) {
    return this.subProcessorsService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a sub-processor by id' })
  update(@Param('id') id: string, @Body() updateSubProcessorDto: UpdateSubProcessorDto) {
    return this.subProcessorsService.update(id, updateSubProcessorDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Remove a sub-processor by id' })
  remove(@Param('id') id: string) {
    return this.subProcessorsService.remove(id);
  }
}
