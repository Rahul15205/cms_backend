import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { PurposesService } from './purposes.service';
import { CreatePurposeDto } from './dto/create-purpose.dto';
import { UpdatePurposeDto } from './dto/update-purpose.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Purposes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/purposes')
export class PurposesController {
  constructor(private readonly purposesService: PurposesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new purpose' })
  create(@Body() createPurposeDto: CreatePurposeDto) {
    return this.purposesService.create(createPurposeDto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve all purposes' })
  findAll() {
    return this.purposesService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve a purpose by id' })
  findOne(@Param('id') id: string) {
    return this.purposesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a purpose by id' })
  update(@Param('id') id: string, @Body() updatePurposeDto: UpdatePurposeDto) {
    return this.purposesService.update(id, updatePurposeDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Remove a purpose by id' })
  remove(@Param('id') id: string) {
    return this.purposesService.remove(id);
  }
}
