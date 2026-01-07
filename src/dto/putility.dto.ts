import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { utilityType } from '../entities/utlityType.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePUtilityDto {
  @ApiProperty({
    description: 'Name of the public utility provider or plan',
    example: 'Acme Electric Saver',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      'Rate offered by the provider. Electric is per kWh; Gas is per ccf',
    example: 0.12345,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  rate: number;

  @ApiProperty({
    description: 'Type of the utility',
    enum: utilityType,
    enumName: 'utilityType',
    example: utilityType.ELECTRIC,
  })
  @IsEnum(utilityType)
  type: string;

  @ApiPropertyOptional({
    description: 'Provider landing page or plan details URL',
    example: 'https://provider.example.com/awesome-plan',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  url?: string;
}

export class UpdatePUtilityDto extends PartialType(CreatePUtilityDto) {}
