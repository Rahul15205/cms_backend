import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Third Parties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/third-parties')
export class ThirdPartiesController {
  constructor(private readonly thirdPartiesService: ThirdPartiesService) {}

  @Post()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'create' })
  @ApiOperation({ summary: 'Create a new third party' })
  create(@Body() createThirdPartyDto: CreateThirdPartyDto) {
    return this.thirdPartiesService.create(createThirdPartyDto);
  }

  @Get()
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve all third parties' })
  findAll() {
    return this.thirdPartiesService.findAll();
  }

  @Get(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'view' })
  @ApiOperation({ summary: 'Retrieve a third party by id' })
  findOne(@Param('id') id: string) {
    return this.thirdPartiesService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'edit' })
  @ApiOperation({ summary: 'Update a third party by id' })
  update(@Param('id') id: string, @Body() updateThirdPartyDto: UpdateThirdPartyDto) {
    return this.thirdPartiesService.update(id, updateThirdPartyDto);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.CONSENT_MANAGEMENT, action: 'admin' })
  @ApiOperation({ summary: 'Remove a third party by id' })
  remove(@Param('id') id: string) {
    return this.thirdPartiesService.remove(id);
  }
}
