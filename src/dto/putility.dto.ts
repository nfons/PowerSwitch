import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { utilityType } from '../entities/utlityType.enum';

export class CreatePUtilityDto {
  @ApiProperty({
    description: 'Name of the public utility provider or plan',
    example: 'Acme Electric Saver',
  })
  name: string;

  @ApiProperty({
    description: 'Rate offered by the provider. Electric is per kWh; Gas is per ccf',
    example: 0.12345,
    type: Number,
  })
  rate: number;

  @ApiProperty({
    description: 'Type of the utility',
    enum: utilityType,
    enumName: 'utilityType',
    example: utilityType.ELECTRIC,
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Provider landing page or plan details URL',
    example: 'https://provider.example.com/awesome-plan',
    nullable: true,
  })
  url?: string;
}

export class UpdatePUtilityDto extends PartialType(CreatePUtilityDto) {}
