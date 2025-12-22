export class CreatePUtilityDto {
  name: string;
  rate: number;
  type: string;
  url: string;
}

export class UpdatePUtilityDto {
  name?: string;
  rate?: number;
  type?: string;
  url?: string;
}
