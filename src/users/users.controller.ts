import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ModuleName, UserStatus } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'create' })
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto, req.user.tenantId);
  }

  @Get()
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'List all users with pagination and filtering' })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiQuery({ name: 'sortBy', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false })
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  findAll(
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.usersService.findAll({ status, search, tenantId, limit, offset, sortBy, sortOrder });
  }

  @Get(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'view' })
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Update an existing user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/status')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Change a user\'s active status' })
  updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.usersService.updateStatus(id, status);
  }

  @Post(':id/end-sessions')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Invalidate all active sessions for a user' })
  endSessions(@Param('id') id: string) {
    return this.usersService.endSessions(id);
  }

  @Post(':id/reset-mfa')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Reset MFA setup for a user' })
  resetMfa(@Param('id') id: string) {
    return this.usersService.resetMfa(id);
  }

  @Post(':id/send-password-reset')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'edit' })
  @ApiOperation({ summary: 'Send a password reset OTP to a user' })
  sendPasswordReset(@Param('id') id: string) {
    return this.usersService.sendPasswordReset(id);
  }

  @Delete(':id')
  @Permissions({ module: ModuleName.USER_SETUP, action: 'admin' })
  @ApiOperation({ summary: 'Soft delete a user (sets status to DISABLED)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
