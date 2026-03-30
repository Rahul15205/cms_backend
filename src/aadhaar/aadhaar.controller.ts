import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AadhaarService } from './aadhaar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

class InitiateAadhaarDto {
  @ApiProperty({ example: '123412341234' })
  @IsNotEmpty()
  @IsString()
  @Length(12, 12)
  aadhaarNumber!: string;
}

class VerifyAadhaarDto {
  @ApiProperty({ example: 'transaction-uuid-123' })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp!: string;
}

@ApiTags('Aadhaar Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/aadhaar')
export class AadhaarController {
  constructor(private readonly aadhaarService: AadhaarService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate Aadhaar verification by sending a mock OTP.' })
  @ApiResponse({ status: 200, description: 'OTP sent успешно.' })
  async initiate(@Request() req: any, @Body() dto: InitiateAadhaarDto) {
    return this.aadhaarService.initiateVerification(req.user.userId, dto.aadhaarNumber);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP and complete Aadhaar verification.' })
  @ApiResponse({ status: 200, description: 'Aadhaar verified successfully.' })
  async verify(@Request() req: any, @Body() dto: VerifyAadhaarDto) {
    return this.aadhaarService.verifyOtp(req.user.userId, dto.transactionId, dto.otp);
  }
}
