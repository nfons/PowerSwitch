import { Controller, Get, Put, Body, Post, Delete } from '@nestjs/common';
import { AppService } from './app.service';
import {CreatePUtilityDto, UpdatePUtilityDto} from "./dto/putility.dto";
import {PutlityService} from "./entities/putility/putlity.service";
import {PUtility} from "./entities/putility/putility.entity";
import {UtilityConfigService} from "./entities/config/utilityConfig.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly putlityService: PutlityService,
              private  readonly utilityService: UtilityConfigService) {

  }
  å
  @Get(['/health', '/'] )
  health(): string {
    return '200 Healthy';
  }

  @Put('/putlity')
  async createPutlity(@Body() createPutlityDto: CreatePUtilityDto){
    try {
      return this.appService.createUtility(createPutlityDto);
    } catch (e) {
      console.log(e);
    }
  }

  @Post('/putlity')
  async createPutlity2(@Body() updatePUtilityDto: UpdatePUtilityDto){
    return 'Adds Utlity Record';
  }

  @Put('/config')
  async createConfig(){
    return 'Adds Config Record';
  }

  @Get('/config')
  async getConfig(){
    try {
      this.utilityService.findAll();
    } catch (e) {
      console.log(e);
    }
  }

}
