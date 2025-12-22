import { Controller, Get, Put, Body, Post, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import {CreatePUtilityDto, UpdatePUtilityDto} from "./dto/putility.dto";
import {PutlityService} from "./entities/putility/putlity.service";
import {PUtility} from "./entities/putility/putility.entity";
import {CurrentUtilityService} from "./entities/config/current-utility.service";
import { CurrentUtility } from './entities/config/currentUtility.entity';
import { CreateCurrentUtilityDto } from './dto/currentUtility.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
              private readonly putlityService: PutlityService,
              private  readonly utilityService: CurrentUtilityService) {

  }

  @Get('/health')
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

  @Get('/putlity')
  async getAllPutlity(): Promise<PUtility[]> {
    try {
      return await this.putlityService.findAll();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Get('/putlity/:id')
  async getPutlityById(@Param('id', ParseIntPipe) id: number): Promise<PUtility | null> {
    try {
      return await this.putlityService.findOne(id);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Get('/config')
  async getConfig(){
    try {
      return await this.utilityService.findAll();
    } catch (e) {
      console.log(e);
    }
  }

  @Get('/config/:id')
  async getConfigById(@Param('id', ParseIntPipe) id: number): Promise<CurrentUtility | null> {
    try {
      return await this.utilityService.findOne(id);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Put('/config')
  async createConfig(@Body() createCurrentUtilityDto: CreateCurrentUtilityDto): Promise<CurrentUtility> {
    try {
      const payload = Object.assign(new CurrentUtility(), createCurrentUtilityDto);
      return await this.utilityService.add(payload);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

}
