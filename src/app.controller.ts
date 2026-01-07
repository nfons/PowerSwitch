import { Controller, Get, Put, Body, Post, Delete, Param, ParseIntPipe, Logger, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreatePUtilityDto, UpdatePUtilityDto } from './dto/putility.dto';
import { PutlityService } from './entities/putility/putlity.service';
import { PUtility } from './entities/putility/putility.entity';
import { CurrentUtilityService } from './entities/current_utility/current-utility.service';
import { CurrentUtility } from './entities/current_utility/currentUtility.entity';
import { CreateCurrentUtilityDto } from './dto/currentUtility.dto';
import { ConfigService } from '@nestjs/config';
import { utilityType } from './entities/utlityType.enum';

@ApiTags('Local App')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly putlityService: PutlityService,
    private readonly utilityService: CurrentUtilityService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Health Check Endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy.' })
  @Get('/health')
  health(): string {
    return '200 Healthy';
  }

  @ApiOperation({ summary: 'Create a new Utility Record' })
  @ApiResponse({
    status: 200,
    description: 'Utility record created successfully.',
  })
  @ApiBody({
    description: 'Payload to create a new public utility record',
    type: CreatePUtilityDto,
  })
  @Put('/putlity')
  async createPutlity(@Body() createPutlityDto: CreatePUtilityDto) {
    try {
      return this.appService.createUtility(createPutlityDto);
    } catch (e) {
      this.logger.error(e);
    }
  }

  @ApiOperation({ summary: 'Create/Update Utility Record NOT IMPLEMENTED YET' })
  @ApiBody({
    description: 'Legacy payload for creating/updating a utility record',
    type: UpdatePUtilityDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Utility record created (legacy response).',
  })
  @Post('/putlity')
  async createPutlity2(@Body() updatePUtilityDto: UpdatePUtilityDto) {
    return 'Adds Utlity Record';
  }

  @ApiOperation({ summary: 'Get all Utility Records' })
  @ApiResponse({
    status: 200,
    description: 'List of all utility records.',
    type: PUtility,
    isArray: true,
  })
  @Get('/putlity')
  async getAllPutlity(): Promise<PUtility[]> {
    try {
      return await this.putlityService.findAll();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @ApiOperation({ summary: 'Get a Utility Record by ID' })
  @ApiParam({ name: 'id', description: 'Utility ID', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Utility record found.',
    type: PUtility,
  })
  @ApiResponse({ status: 404, description: 'Utility record not found.' })
  @Get('/putlity/:id')
  async getPutlityById(@Param('id', ParseIntPipe) id: number): Promise<PUtility | null> {
    try {
      return await this.putlityService.findOne(id);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @ApiOperation({ summary: 'Get best Utility Record for a given type' })
  @ApiParam({
    name: 'type',
    description: 'Type of utility',
    enum: utilityType,
    example: utilityType.GAS,
  })
  @ApiResponse({
    status: 200,
    description: 'Best utility record for the given type.',
    type: PUtility,
  })
  @ApiResponse({
    status: 404,
    description: 'No best utility found for the given type.',
  })
  @Get('/putility/best/:type')
  async getBestPutlity(@Param('type') type: string): Promise<PUtility | null> {
    const best = await this.putlityService.findBest(type);
    if (best === null) {
      throw new NotFoundException('No best utility found');
    } else {
      return best;
    }
  }

  @ApiOperation({ summary: 'Get all Current Utility configuration records' })
  @ApiResponse({
    status: 200,
    description: 'List of all current utility configurations.',
    type: CurrentUtility,
    isArray: true,
  })
  @Get('/config')
  async getConfig() {
    try {
      return await this.utilityService.findAll();
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Get('/config/current/:type')
  @ApiOperation({
    summary: 'Get the current Current Utility configuration by type',
  })
  @ApiParam({
    name: 'type',
    description: 'Type of utility',
    enum: utilityType,
    example: utilityType.ELECTRIC,
  })
  @ApiResponse({
    status: 200,
    description: 'Current configuration record found.',
    type: CurrentUtility,
  })
  @ApiResponse({
    status: 404,
    description: 'Current configuration record not found.',
  })
  async getCurrentConfig(@Param('type') type: string): Promise<CurrentUtility | null> {
    try {
      const current = await this.utilityService.findCurrent(type);
      if (!current) {
        throw new NotFoundException('Current configuration record not found.');
      }
      return current;
    } catch (e) {
      throw new NotFoundException('Current configuration record not found.');
    }
  }

  @ApiOperation({ summary: 'Get a Current Utility configuration by ID' })
  @ApiParam({
    name: 'id',
    description: 'Configuration ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration record found.',
    type: CurrentUtility,
  })
  @ApiResponse({ status: 404, description: 'Configuration record not found.' })
  @Get('/config/:id')
  async getConfigById(@Param('id', ParseIntPipe) id: number): Promise<CurrentUtility | null> {
    try {
      return await this.utilityService.findOne(id);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  @ApiOperation({ summary: 'Create a Current Utility configuration' })
  @ApiBody({
    description: 'Payload to create a Current Utility configuration',
    type: CreateCurrentUtilityDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration created successfully.',
    type: CurrentUtility,
  })
  @Put('/config')
  async createConfig(@Body() createCurrentUtilityDto: CreateCurrentUtilityDto): Promise<CurrentUtility> {
    try {
      const payload = Object.assign(new CurrentUtility(), createCurrentUtilityDto);
      return await this.utilityService.add(payload);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
