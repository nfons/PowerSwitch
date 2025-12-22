import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUtilityService } from '../src/entities/config/current-utility.service';
import { CurrentUtility } from '../src/entities/config/currentUtility.entity';

describe('CurrentUtilityService', () => {
  let service: CurrentUtilityService;
  let repository: Repository<CurrentUtility>;

  const mockCurrentUtility: CurrentUtility = {
    id: 1,
    nextrun: new Date('2025-12-20'),
    fields: { key: 'value' },
    rate: 0.12,
  };

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrentUtilityService,
        {
          provide: getRepositoryToken(CurrentUtility),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CurrentUtilityService>(CurrentUtilityService);
    repository = module.get<Repository<CurrentUtility>>(
      getRepositoryToken(CurrentUtility),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of current utilities', async () => {
      const configs = [mockCurrentUtility];
      mockRepository.find.mockResolvedValue(configs);

      const result = await service.findAll();

      expect(result).toEqual(configs);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single current utility', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockCurrentUtility);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCurrentUtility);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when config not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('remove', () => {
    it('should delete a current utility', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('add', () => {
    it('should create and return a new current utility', async () => {
      mockRepository.save.mockResolvedValue(mockCurrentUtility);

      const result = await service.add(mockCurrentUtility);

      expect(result).toEqual(mockCurrentUtility);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCurrentUtility);
    });
  });
});
