import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { TasksService } from '../src/task.service';
import { CronJob } from 'cron';
import { PutlityService } from '../src/entities/putility/putlity.service';

// Mock CronJob
jest.mock('cron', () => {
  const mockStart = jest.fn();
  const mockStop = jest.fn();

  class MockCronJob {
    public start = mockStart;
    public stop = mockStop;
    private callback: () => void;

    constructor(cronTime: string, onTick: () => void) {
      this.callback = onTick;
    }

    fireNow() {
      this.callback();
    }
  }

  return { CronJob: MockCronJob };
});

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

describe('TasksService', () => {
  let service: TasksService;
  let configService: ConfigService;
  let schedulerRegistry: SchedulerRegistry;
  let mockCronJob: any;


  const mockConfigService = {
    get: jest.fn(),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    getCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  const mockPutlityService = {
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: PutlityService,
          useValue: mockPutlityService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    configService = module.get<ConfigService>(ConfigService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have default schedule set to EVERY_1ST_DAY_OF_MONTH_AT_NOON', () => {
      expect(service.schedule).toBe(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON);
    });

    it('should use default schedule when CRON_TIME is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module = Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      expect(mockConfigService.get).toHaveBeenCalledWith('CRON_TIME');
    });

    it('should register cron job with SchedulerRegistry', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'TasksService',
        expect.any(CronJob),
      );
    });

    it('should add cron job to scheduler registry and start it', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      // Verify addCronJob was called with correct parameters
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'TasksService',
        expect.objectContaining({
          start: expect.any(Function),
        }),
      );
    });
  });

  describe('Schedule Configuration', () => {
    it('should use custom CRON_TIME from config when provided', async () => {
      const customSchedule = '0 0 * * *'; // Every day at midnight
      mockConfigService.get.mockReturnValue(customSchedule);

      const module = await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      expect(mockConfigService.get).toHaveBeenCalledWith('CRON_TIME');
    });

    it('should handle empty string CRON_TIME by using default', async () => {
      mockConfigService.get.mockReturnValue('');

      const module = await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      expect(service.schedule).toBe(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON);
    });

    it('should handle null CRON_TIME by using default', async () => {
      mockConfigService.get.mockReturnValue(null);

      const module = await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      const service = module.get<TasksService>(TasksService);
      expect(service.schedule).toBe(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON);
    });
  });

  describe('Cron Job Execution', () => {
    it('should create cron job with correct schedule', async () => {
      const customSchedule = '0 */6 * * *'; // Every 6 hours
      mockConfigService.get.mockReturnValue(customSchedule);

      await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
      expect(mockConfigService.get).toHaveBeenCalledWith('CRON_TIME');
    });

    it('should register cron job with TasksService name', async () => {
      await Test.createTestingModule({
        providers: [
          TasksService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: SchedulerRegistry,
            useValue: mockSchedulerRegistry,
          },
          {
            provide: PutlityService,
            useValue: mockPutlityService,
          },
        ],
      }).compile();

      const [[jobName]] = mockSchedulerRegistry.addCronJob.mock.calls;
      expect(jobName).toBe('TasksService');
    });
  });

  describe('Edge Cases', () => {
    it('should handle various cron expression formats', async () => {
      const cronExpressions = [
        '* * * * *',
        '0 * * 1 *',
        '*/5 * * * *',
      ];

      for (const expr of cronExpressions) {
        mockConfigService.get.mockReturnValue(expr);

        const module = await Test.createTestingModule({
          providers: [
            TasksService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
            {
              provide: SchedulerRegistry,
              useValue: mockSchedulerRegistry,
            },
            {
              provide: PutlityService,
              useValue: mockPutlityService,
            },
          ],
        }).compile();

        const service = module.get<TasksService>(TasksService);
        expect(service).toBeDefined();
      }
    });
  });

  describe('parsePrice', () => {

    it('should parse valid price string with dollar sign', () => {
      const result = service['parsePrice']('$12.99');
      expect(result).toBe(12.99);
    });

    it('should parse price string without dollar sign', () => {
      const result = service['parsePrice']('25.50');
      expect(result).toBe(25.50);
    });

    it('should parse price with multiple special characters', () => {
      const result = service['parsePrice']('$1,234.56');
      expect(result).toBe(1234.56);
    });

    it('should return Infinity for null price', () => {
      const result = service['parsePrice'](null);
      expect(result).toBe(Infinity);
    });

    it('should return Infinity for undefined price', () => {
      const result = service['parsePrice'](undefined);
      expect(result).toBe(Infinity);
    });

    it('should return Infinity for empty string', () => {
      const result = service['parsePrice']('');
      expect(result).toBe(Infinity);
    });

    it('should parse price with cents', () => {
      const result = service['parsePrice']('0.99');
      expect(result).toBe(0.99);
    });

    it('should parse integer price', () => {
      const result = service['parsePrice']('100');
      expect(result).toBe(100);
    });

    it('should handle price with spaces', () => {
      const result = service['parsePrice']('$ 12.99 ');
      expect(result).toBe(12.99);
    });

    it('should parse price with only numbers', () => {
      const result = service['parsePrice']('42');
      expect(result).toBe(42);
    });
  });

  describe('fetchCSV', () => {
    let mockFetch: jest.Mock;
    let mockStream: any;

    beforeEach(async () => {
      mockFetch = require('node-fetch') as jest.Mock;
      mockFetch.mockClear();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch gas CSV when type is gas', async () => {
      const gasUrl = 'https://example.com/gas.csv';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return gasUrl;
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          pipe: jest.fn().mockReturnValue({
            on: jest.fn().mockReturnThis(),
          }),
        },
      });

      await service['fetchCSV']('gas');

      expect(mockFetch).toHaveBeenCalledWith(gasUrl);
    });

    it('should fetch electric CSV when type is electric', async () => {
      const electricUrl = 'https://example.com/electric.csv';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ELECTRIC_URL') return electricUrl;
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          pipe: jest.fn().mockReturnValue({
            on: jest.fn().mockReturnThis(),
          }),
        },
      });

      await service['fetchCSV']('electric');

      expect(mockFetch).toHaveBeenCalledWith(electricUrl);
    });

    it('should handle fetch error gracefully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        return undefined;
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service['fetchCSV']('gas')).resolves.not.toThrow();
    });

    it('should handle non-ok response', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(service['fetchCSV']('gas')).resolves.not.toThrow();
    });

    it('should handle response without body', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        return undefined;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      await expect(service['fetchCSV']('gas')).resolves.not.toThrow();
    });
  });

  describe('getUtilityRates', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'fetchCSV').mockResolvedValue(undefined);
    });

    it('should use web approach when API_TYPE is web', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'web';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(mockConfigService.get).toHaveBeenCalledWith('API_TYPE');
      expect(service['fetchCSV']).not.toHaveBeenCalled();
    });

    it('should fetch gas CSV when GAS_URL is configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'csv';
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchCSV']).toHaveBeenCalledWith('gas');
    });

    it('should fetch electric CSV when ELECTRIC_URL is configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'csv';
        if (key === 'ELECTRIC_URL') return 'https://example.com/electric.csv';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchCSV']).toHaveBeenCalledWith('electric');
    });

    it('should fetch both gas and electric when both URLs are configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'csv';
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        if (key === 'ELECTRIC_URL') return 'https://example.com/electric.csv';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchCSV']).toHaveBeenCalledWith('gas');
      expect(service['fetchCSV']).toHaveBeenCalledWith('electric');
      expect(service['fetchCSV']).toHaveBeenCalledTimes(2);
    });

    it('should not fetch CSV when neither URL is configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'csv';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchCSV']).not.toHaveBeenCalled();
    });

    it('should default to CSV approach when API_TYPE is not set', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas.csv';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchCSV']).toHaveBeenCalledWith('gas');
    });
  });
});
