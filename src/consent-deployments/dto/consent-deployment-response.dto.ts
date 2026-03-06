import { ApiProperty } from '@nestjs/swagger';

export class ConsentDeploymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() versionId!: string;
  @ApiProperty() applicationId!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() deployedAt!: Date;
}
