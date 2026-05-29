import { IsString, IsNotEmpty, MaxLength, IsEmail, IsOptional, IsEnum, IsArray } from 'class-validator'; // PHASE 6 CHANGE
import { RightsRequestType, Regulation, SubmissionChannel } from '@prisma/client'; // PHASE 6 CHANGE

export class PublicRightsRequestDto {
  @IsString() // PHASE 6 CHANGE
  @IsNotEmpty() // PHASE 6 CHANGE
  @MaxLength(200) // PHASE 6 CHANGE
  requesterName: string;

  @IsEmail() // PHASE 6 CHANGE
  @IsNotEmpty() // PHASE 6 CHANGE
  requesterEmail: string;

  @IsString() // PHASE 6 CHANGE
  @IsOptional() // PHASE 6 CHANGE
  requesterPhone?: string;

  @IsEnum(RightsRequestType) // PHASE 6 CHANGE
  @IsNotEmpty() // PHASE 6 CHANGE
  type: RightsRequestType;

  @IsEnum(Regulation) // PHASE 6 CHANGE
  @IsNotEmpty() // PHASE 6 CHANGE
  regulation: Regulation;

  @IsString() // PHASE 6 CHANGE
  @IsNotEmpty() // PHASE 6 CHANGE
  @MaxLength(3000) // PHASE 6 CHANGE
  description: string;

  @IsEnum(SubmissionChannel) // PHASE 6 CHANGE
  @IsOptional() // PHASE 6 CHANGE
  submissionChannel?: SubmissionChannel;  // defaults to 'WEB' if not provided

  @IsArray() // PHASE 6 CHANGE
  @IsString({ each: true }) // PHASE 6 CHANGE
  @IsOptional() // PHASE 6 CHANGE
  dataCategories?: string[];
}
