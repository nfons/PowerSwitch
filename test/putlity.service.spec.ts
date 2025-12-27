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
    url: 'https://example.com',
    rateLength: 12,
    createdAt: new Date(),
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
    repository = module.get<Repository<PUtility>>(getRepositoryToken(PUtility));
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

  describe('findBest', () => {
    it('should return the valid record with the lowest rate', async () => {
      const now = new Date();
      const utilities: PUtility[] = [
        {
          id: 1,
          name: 'Provider A',
          rate: 0.15,
          type: 'electric',
          url: 'https://example.com/a',
          rateLength: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: 2,
          name: 'Provider B',
          rate: 0.12,
          type: 'electric',
          url: 'https://example.com/b',
          rateLength: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          id: 3,
          name: 'Provider C',
          rate: 0.18,
          type: 'electric',
          url: 'https://example.com/c',
          rateLength: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      ];

      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findBest('electric');

      expect(result).toEqual(utilities[1]); // Provider B has the lowest rate (0.12)
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: 'electric' },
      });
    });

    it('should filter out expired records', async () => {
      const now = new Date();
      const utilities: PUtility[] = [
        {
          id: 1,
          name: 'Provider A',
          rate: 0.1, // Lowest rate but expired
          type: 'electric',
          url: 'https://example.com/a',
          rateLength: 1,
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago (expired)
        },
        {
          id: 2,
          name: 'Provider B',
          rate: 0.15,
          type: 'electric',
          url: 'https://example.com/b',
          rateLength: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (valid)
        },
      ];

      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findBest('electric');

      expect(result).toEqual(utilities[1]); // Provider B, even though it has higher rate
    });

    it('should return null when no records exist for the type', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findBest('gas');

      expect(result).toBeNull();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: 'gas' },
      });
    });

    it('should return null when all records are expired', async () => {
      const now = new Date();
      const utilities: PUtility[] = [
        {
          id: 1,
          name: 'Provider A',
          rate: 0.15,
          type: 'electric',
          url: 'https://example.com/a',
          rateLength: 1,
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        },
        {
          id: 2,
          name: 'Provider B',
          rate: 0.12,
          type: 'electric',
          url: 'https://example.com/b',
          rateLength: 1,
          createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        },
      ];

      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findBest('electric');

      expect(result).toBeNull();
    });

    it('should correctly calculate expiration date', async () => {
      const now = new Date();
      const utilities: PUtility[] = [
        {
          id: 1,
          name: 'Provider A',
          rate: 0.15,
          type: 'gas',
          url: 'https://example.com/a',
          rateLength: 6,
          createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago (6 months)
        },
        {
          id: 2,
          name: 'Provider B',
          rate: 0.12,
          type: 'gas',
          url: 'https://example.com/b',
          rateLength: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (still valid)
        },
      ];

      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findBest('gas');

      expect(result).toEqual(utilities[1]); // Provider B is the only valid one
    });

    it('should handle records with different rate lengths', async () => {
      const now = new Date();
      const utilities: PUtility[] = [
        {
          id: 1,
          name: 'Provider A',
          rate: 0.16,
          type: 'electric',
          url: 'https://example.com/a',
          rateLength: 1, // 1 month
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (valid)
        },
        {
          id: 2,
          name: 'Provider B',
          rate: 0.14,
          type: 'electric',
          url: 'https://example.com/b',
          rateLength: 24, // 24 months
          createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago (valid)
        },
      ];

      mockRepository.find.mockResolvedValue(utilities);

      const result = await service.findBest('electric');

      expect(result).toEqual(utilities[1]); // Provider B has the lower rate
    });
  });
});
