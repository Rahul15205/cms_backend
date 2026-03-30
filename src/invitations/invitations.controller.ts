import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'create' })
  @ApiOperation({ summary: 'Create and send a new invitation' })
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req: any) {
    return this.invitationsService.create(createInvitationDto, req.user.userId, req.user.tenantId);
  }

  @Get()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'List invitations' })
  @ApiQuery({ name: 'tenantId', required: false })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.invitationsService.findAll(tenantId);
  }

  @Put(':id/resend')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Resend an invitation' })
  resend(@Param('id') id: string) {
    return this.invitationsService.resend(id);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'admin' })
  @ApiOperation({ summary: 'Cancel/delete an invitation' })
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(id);
  }
}
