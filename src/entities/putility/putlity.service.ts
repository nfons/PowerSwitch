
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PUtility } from './putility.entity';

@Injectable()
export class PutlityService {
    constructor(
        @InjectRepository(PUtility)
        private PUtilityRepository: Repository<PUtility>,
    ) {}

    findAll(): Promise<PUtility[]> {
        return this.PUtilityRepository.find();
    }

    findOne(id: number): Promise<PUtility | null> {
        return this.PUtilityRepository.findOneBy({ id });
    }
    // TODO
    findBest(type: string): Promise<PUtility> | null {
        return;
    }

    async remove(id: number): Promise<void> {
        await this.PUtilityRepository.delete(id);
    }

    async add(PUtility: PUtility): Promise<PUtility> {
        return this.PUtilityRepository.save(PUtility);
    }
}
