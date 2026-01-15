import { Injectable } from '@nestjs/common';
import { PUtility } from './entities/putility/putility.entity';
import { CreatePUtilityDto } from './dto/putility.dto';
import { PutlityService } from './entities/putility/putlity.service';

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

  async createUtility(createPutlityDto: CreatePUtilityDto) {
    const putlity = new PUtility();
    putlity.name = createPutlityDto.name;
    putlity.rate = createPutlityDto.rate;
    putlity.type = createPutlityDto.type;
    // eslint-disable-next-line no-useless-catch
    try {
      await this.putilityservice.add(putlity);
    } catch (e) {
      throw e;
    }
    return 'Utility Record Created';
  }
}
