import { Injectable } from '@nestjs/common';
import {PUtility} from "./entities/putility/putility.entity";
import {CreatePUtilityDto} from "./dto/putility.dto";
import {PutlityService} from "./entities/putility/putlity.service";

@Injectable()
export class AppService {
  constructor(private readonly putilityservice: PutlityService) {}

  getUtilities() {
   try {
     return this.putilityservice.findAll();
   } catch (e) {
     throw e;
   }
  }

  createUtility(createPutlityDto: CreatePUtilityDto){
    let putlity = new PUtility()
    putlity.name = createPutlityDto.name;
    putlity.rate = createPutlityDto.rate;
    putlity.type = createPutlityDto.type;
    try {
      this.putilityservice.add(putlity)
    } catch (e) {
      throw e;
    }
    return 'Utility Record Created';
   }
}
