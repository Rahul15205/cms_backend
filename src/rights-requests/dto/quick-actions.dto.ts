import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator'; // PHASE 3 CHANGE
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // PHASE 3 CHANGE
import { RejectionReason } from '@prisma/client'; // PHASE 3 CHANGE

// PHASE 3 CHANGE
export class ApproveRequestDto {}

// PHASE 3 CHANGE
export class RejectRequestDto {
  @ApiProperty({ enum: RejectionReason, description: 'Reason for rejecting the request' })
  @IsEnum(RejectionReason)
  @IsNotEmpty()
  reason!: RejectionReason;

  @ApiPropertyOptional({ description: 'Optional explanation for rejection' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}

// PHASE 3 CHANGE
export class EscalateRequestDto {
  @ApiProperty({ enum: ['SENIOR_OFFICER', 'DPO', 'LEGAL'], description: 'Escalation target role' })
  @IsEnum(['SENIOR_OFFICER', 'DPO', 'LEGAL'])
  @IsNotEmpty()
  target!: 'SENIOR_OFFICER' | 'DPO' | 'LEGAL';

  @ApiProperty({ description: 'Escalation rationale description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  rationale!: string;
}

// PHASE 3 CHANGE
export class RequestMoreInfoDto {
  @ApiProperty({ description: 'Message sent to the requester' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message!: string;
}

// PHASE 3 CHANGE
export class PartialFulfilmentDto {
  @ApiProperty({ description: 'Description of what was fulfilled' })
  @IsString()
  @IsNotEmpty()
  fulfilled!: string;

  @ApiProperty({ description: 'Description of what was withheld' })
  @IsString()
  @IsNotEmpty()
  withheld!: string;

  @ApiProperty({ description: 'Legal justification for withholding data' })
  @IsString()
  @IsNotEmpty()
  legalJustification!: string;
}

// PHASE 3 CHANGE
export class GenerateExtractDto {}
