export class CreateCurrentUtilityDto {
  name: string;
  type: string;
  rate: number;
  duration?: Date;
  fields?: any;
}

export class UpdateCurrentUtilityDto {
  name?: string;
  type?: string;
  rate?: number;
  duration?: Date;
  fields?: any;
}
