import { IsEnum } from 'class-validator';
import { utilityType } from '../entities/utlityType.enum';

export class CreateCurrentUtilityDto {
  name: string;
  @IsEnum(utilityType)
  type: string;
  rate: number;
  duration?: Date;
  fields?: any;
}

export class UpdateCurrentUtilityDto {
  name?: string;
  @IsEnum(utilityType)
  type?: string;
  rate?: number;
  duration?: Date;
  fields?: any;
}
