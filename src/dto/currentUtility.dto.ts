import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
  Min,
} from 'class-validator';
import { utilityType } from '../entities/utlityType.enum';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCurrentUtilityDto {
  @ApiProperty({
    description: 'Display name for the current utility provider or plan',
    example: 'Acme Gas Saver',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of utility',
    enum: utilityType,
    enumName: 'utilityType',
    example: utilityType.GAS,
  })
  @IsEnum(utilityType)
  type: string;

  @ApiProperty({
    description:
      'Rate charged by the provider. For Gas this is per ccf, for Electric per kWh',
    example: 0.12345,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  rate: number;

  @ApiPropertyOptional({
    description: 'Date/time (ISO 8601) until which this rate is valid',
    type: String,
    format: 'date-time',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  duration?: Date;

  @ApiPropertyOptional({
    description: 'Additional provider-specific fields stored as a JSON object',
    type: 'object',
    additionalProperties: true,
    example: { accountNumber: '123456789', promoCode: 'WINTER-25' },
    nullable: true,
  })
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: any;
}

export class UpdateCurrentUtilityDto extends PartialType(
  CreateCurrentUtilityDto,
) {}
