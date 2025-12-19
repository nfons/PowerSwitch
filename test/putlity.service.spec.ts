import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutlityService } from '../src/entities/putility/putlity.service';
import { PUtility } from '../src/entities/putility/putility.entity';

describe('PutlityService', () => {
  let service: PutlityService;
  let repository: Repository<PUtility>;

  const mockPUtility: PUtility = {
    id: 1,
    name: 'Electric Company',
    rate: 0.15,
    type: 'electricity',
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
        PutlityService,
        {
          provide: getRepositoryToken(PUtility),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PutlityService>(PutlityService);
    repository = module.get<Repository<PUtility>>(
      getRepositoryToken(PUtility),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of utilities', async () => {
      const utilities = [mockPUtility];
      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findAll();

      expect(result).toEqual(utilities);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single utility', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockPUtility);

      const result = await service.findOne(1);

      expect(result).toEqual(mockPUtility);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when utility not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('remove', () => {
    it('should delete a utility', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('add', () => {
    it('should create and return a new utility', async () => {
      mockRepository.save.mockResolvedValue(mockPUtility);

      const result = await service.add(mockPUtility);

      expect(result).toEqual(mockPUtility);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPUtility);
    });
  });
});
