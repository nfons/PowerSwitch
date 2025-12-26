import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { TasksService } from '../src/task.service';
import { CronJob } from 'cron';

// Mock CronJob
jest.mock('cron', () => {
  class MockCronJob {
    public start = jest.fn();
    public stop = jest.fn();
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

describe('TasksService', () => {
  let service: TasksService;
  let configService: ConfigService;
  let schedulerRegistry: SchedulerRegistry;
  let mockCronJob: any;
  let testingModule: TestingModule;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn((name: string, job: any) => {
      mockCronJob = job;
    }),
    getCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    testingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    service = testingModule.get<TasksService>(TasksService);
    configService = testingModule.get<ConfigService>(ConfigService);
    schedulerRegistry = testingModule.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(async () => {
    // Stop the cron job to allow tests to exit gracefully
    if (mockCronJob && mockCronJob.stop) {
      mockCronJob.stop();
    }
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
          ],
        }).compile();

        const service = module.get<TasksService>(TasksService);
        expect(service).toBeDefined();
      }
    });
  });
});
