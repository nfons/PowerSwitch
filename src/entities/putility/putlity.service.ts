
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
    async findBest(type: string): Promise<PUtility | null> {
        // Get all records of the specified type
        const records = await this.PUtilityRepository.find({
            where: { type: type }
        });

        if (records.length === 0) {
            return null;
        }

        const now = new Date();

        // Filter valid records (not expired)
        const validRecords = records.filter(record => {
            const expirationDate = new Date(record.createdAt);
            expirationDate.setMonth(expirationDate.getMonth() + record.rateLength);
            return expirationDate > now;
        });

        if (validRecords.length === 0) {
            return null;
        }

        // Find the record with the lowest rate
        return validRecords.reduce((best, current) => {
            return current.rate < best.rate ? current : best;
        });
    }

    async remove(id: number): Promise<void> {
        await this.PUtilityRepository.delete(id);
    }

    async add(PUtility: PUtility): Promise<PUtility> {
        return this.PUtilityRepository.save(PUtility);
    }
}
