import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilityConfigService } from '../src/entities/config/utilityConfig.service';
import { UtilityConfig } from '../src/entities/config/utlityConfig.entity';

describe('UtilityConfigService', () => {
  let service: UtilityConfigService;
  let repository: Repository<UtilityConfig>;

  const mockUtilityConfig: UtilityConfig = {
    id: 1,
    nextrun: new Date('2025-12-20'),
    fields: { key: 'value' },
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
        UtilityConfigService,
        {
          provide: getRepositoryToken(UtilityConfig),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UtilityConfigService>(UtilityConfigService);
    repository = module.get<Repository<UtilityConfig>>(
      getRepositoryToken(UtilityConfig),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of utility configs', async () => {
      const configs = [mockUtilityConfig];
      mockRepository.find.mockResolvedValue(configs);

      const result = await service.findAll();

      expect(result).toEqual(configs);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single utility config', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUtilityConfig);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUtilityConfig);
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
    it('should delete a utility config', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('add', () => {
    it('should create and return a new utility config', async () => {
      mockRepository.save.mockResolvedValue(mockUtilityConfig);

      const result = await service.add(mockUtilityConfig);

      expect(result).toEqual(mockUtilityConfig);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUtilityConfig);
    });
  });
});
