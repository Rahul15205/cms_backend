import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login and acquire JWT & Refresh Token (Rate limited: 5 attempts/min)' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate your Refresh Token and acquire new JWT access' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @Post('mfa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a new MFA secret and QR code for the user.' })
  generateMfa(@Request() req: any) {
    return this.authService.generateMfaSecret(req.user.userId);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP code and enable MFA for the user.' })
  verifyMfa(@Request() req: any, @Body() body: { token: string }) {
    return this.authService.verifyAndEnableMfa(req.user.userId, body.token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authorized user with full profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
