
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {UtilityConfig} from './utlityConfig.entity';

@Injectable()
export class UtilityConfigService {
    constructor(
        @InjectRepository(UtilityConfig)
        private UtilityConfigRepository: Repository<UtilityConfig>,
    ) {}

    findAll(): Promise<UtilityConfig[]> {
        return this.UtilityConfigRepository.find();
    }

    findOne(id: number): Promise<UtilityConfig | null> {
        return this.UtilityConfigRepository.findOneBy({ id });
    }

    async remove(id: number): Promise<void> {
        await this.UtilityConfigRepository.delete(id);
    }

    async add(UtilityConfig: UtilityConfig): Promise<UtilityConfig> {
        return this.UtilityConfigRepository.save(UtilityConfig);
    }
}
