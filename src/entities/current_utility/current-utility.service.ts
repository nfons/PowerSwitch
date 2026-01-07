import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUtility } from './currentUtility.entity';

@Injectable()
export class CurrentUtilityService {
  constructor(
    @InjectRepository(CurrentUtility)
    private currentUtilityRepository: Repository<CurrentUtility>,
  ) {}

  async findAll(): Promise<CurrentUtility[]> {
    return this.currentUtilityRepository.find();
  }

  async findOne(id: number): Promise<CurrentUtility | null> {
    return this.currentUtilityRepository.findOneBy({ id });
  }

  // Return the latest record by type
  async findCurrent(type: string): Promise<CurrentUtility | null> {
    return this.currentUtilityRepository.findOne({
      where: { type },
      order: { id: 'DESC' },
    });
  }

  async remove(id: number): Promise<void> {
    await this.currentUtilityRepository.delete(id);
  }

  async add(currentUtility: CurrentUtility): Promise<CurrentUtility> {
    return this.currentUtilityRepository.save(currentUtility);
  }
}
