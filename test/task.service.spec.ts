import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { TasksService } from '../src/task.service';
import { CronJob } from 'cron';
import { PutlityService } from '../src/entities/putility/putlity.service';

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

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// Mock cheerio
jest.mock('cheerio', () => ({
  load: jest.fn(),
}));

// Mock Logger
// This is stupid isn't it? I feel like its overkill to mock everything....
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');

  class MockLogger {
    log = jest.fn();
    error = jest.fn();
    warn = jest.fn();
    debug = jest.fn();
    verbose = jest.fn();

    static overrideLogger = jest.fn();
    static log = jest.fn();
    static error = jest.fn();
    static warn = jest.fn();
    static debug = jest.fn();
    static verbose = jest.fn();
  }

  return {
    ...actual,
    Logger: MockLogger,
  };
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

  const mockPutlityService = {
    add: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(TasksService.prototype, 'onModuleInit')
      .mockImplementation(() => undefined);

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
        {
          provide: PutlityService,
          useValue: mockPutlityService,
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

    it('should have default schedule set to 0 0 10 * *', () => {
      expect(service.schedule).toBe(
        '0 0 10 * *',
      );
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
      expect(service.schedule).toBe(
        '0 0 10 * *'
      );
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
      expect(service.schedule).toBe(
        '0 0 10 * *',
      );
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
      const cronExpressions = ['* * * * *', '0 * * 1 *', '*/5 * * * *'];

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
      expect(result).toBe(25.5);
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
      jest.spyOn(service as any, 'fetchWeb').mockResolvedValue(undefined);
    });

    it('should use web approach when API_TYPE is web', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'web';
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(mockConfigService.get).toHaveBeenCalledWith('API_TYPE');
      expect(service['fetchCSV']).not.toHaveBeenCalled();
      expect(service['fetchWeb']).toHaveBeenCalledWith('gas');
    });

    it('should fetch both gas and electric via web when API_TYPE is web and both URLs configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'API_TYPE') return 'web';
        if (key === 'GAS_URL') return 'https://example.com/gas';
        if (key === 'ELECTRIC_URL') return 'https://example.com/electric';
        return undefined;
      });

      await service['getUtilityRates']();

      expect(service['fetchWeb']).toHaveBeenCalledWith('gas');
      expect(service['fetchWeb']).toHaveBeenCalledWith('electric');
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
  describe('getGoogleUrl', () => {
    it('should return encoded Google search URL for a simple term', () => {
      const term = 'Acme Energy';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe('https://www.google.com/search?q=Acme%20Energy');
    });

    it('should properly encode special characters', () => {
      const term = 'Energy & Power Inc.';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe(
        'https://www.google.com/search?q=Energy%20%26%20Power%20Inc.',
      );
    });

    it('should handle phone numbers', () => {
      const term = '1-800-555-1234';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe('https://www.google.com/search?q=1-800-555-1234');
    });

    it('should encode URLs in search terms', () => {
      const term = 'https://example.com/supplier';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe(
        'https://www.google.com/search?q=https%3A%2F%2Fexample.com%2Fsupplier',
      );
    });

    it('should handle empty string', () => {
      const term = '';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe('https://www.google.com/search?q=');
    });

    it('should encode terms with multiple spaces', () => {
      const term = 'Power  Company  Name';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe(
        'https://www.google.com/search?q=Power%20%20Company%20%20Name',
      );
    });

    it('should encode special characters like quotes', () => {
      const term = 'Company "Best Rate"';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe(
        'https://www.google.com/search?q=Company%20%22Best%20Rate%22',
      );
    });

    it('should encode plus signs', () => {
      const term = 'Energy+Plus';
      const result = service['getGoogleUrl'](term);
      expect(result).toBe('https://www.google.com/search?q=Energy%2BPlus');
    });
  });

  describe('getDataFromNode', () => {
    let cheerio: any;

    beforeEach(() => {
      cheerio = jest.requireActual('cheerio');
      mockPutlityService.add.mockClear();
    });

    it('should call putilityService.add when valid provider data is found', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div class="name">Test Provider</div>
              <div>$0.12 per kwh</div>
              <div>Term Length: 12 Months</div>
              <div class="second"><a href="https://example.com/provider">Details</a></div>
            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [];

      service['getDataFromNode'](element, $, 'electric', results);

      expect(mockPutlityService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Provider',
          rate: 0.12,
          type: 'electric',
          rateLength: 12,
          url: 'https://example.com/provider',
        }),
      );
    });

    it('should not call putilityService.add when provider is Unknown', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div>$0.12 per kwh</div>
              <div>Term Length: 12 Months</div>
            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [];

      service['getDataFromNode'](element, $, 'electric', results);

      expect(mockPutlityService.add).not.toHaveBeenCalled();
    });

    it('should not call putilityService.add for duplicate entries', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div class="name">Test Provider</div>
              <div>$0.12 per kwh</div>
              <div>Term Length: 12 Months</div>
              <div class="second"><a href="https://example.com/provider">Details</a></div>
            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [{ provider: 'Test Provider', price: '0.12' }];

      service['getDataFromNode'](element, $, 'electric', results);

      expect(mockPutlityService.add).not.toHaveBeenCalled();
    });

    it('should use google URL when no provider URL is found', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div class="name">Test Provider</div>
              <div>$0.12 per kwh</div>
              <div>Term Length: 12 Months</div>
            </div>
          </body>
        </html>
      `;

      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [];

      service['getDataFromNode'](element, $, 'gas', results);

      expect(mockPutlityService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.google.com/search?q=Test%20Provider',
        }),
      );
    });
  });

  describe('fetchWeb', () => {
    let mockPuppeteer: any;
    let mockCheerio: any;
    let mockBrowser: any;
    let mockPage: any;

    beforeEach(() => {
      mockPuppeteer = require('puppeteer');
      mockCheerio = require('cheerio');

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        content: jest.fn().mockResolvedValue('<html></html>'),
      };

      mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should launch puppeteer in headless mode', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_WEB_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockPuppeteer.launch).toHaveBeenCalledWith({ headless: true });
    });

    it('should navigate to gas URL when type is gas', async () => {
      const gasWebUrl = 'https://example.com/gas-rates';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return gasWebUrl;
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockPage.goto).toHaveBeenCalledWith(gasWebUrl, {
        waitUntil: 'networkidle2',
      });
    });

    it('should navigate to electric URL when type is electric', async () => {
      const electricWebUrl = 'https://example.com/electric-rates';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ELECTRIC_URL') return electricWebUrl;
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('electric');

      expect(mockPage.goto).toHaveBeenCalledWith(electricWebUrl, {
        waitUntil: 'networkidle2',
      });
    });

    it('should fetch and parse HTML content', async () => {
      const htmlContent =
        '<html><body><div class="supplier-card">Test</div></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockPage.content).toHaveBeenCalled();
      expect(mockCheerio.load).toHaveBeenCalledWith(htmlContent);
    });

    it('should close browser after fetching data', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should search for supplier-card elements', async () => {
      const htmlContent = `
        <html>
          <body>
            <div class="supplier-card">
              <div class="name">Acme Energy</div>
              <div>$0.12 per kwh</div>
              <div>12 Months</div>
              <div class="second"><a href="https://example.com/acme">Details</a></div>
            </div>
          </body>
        </html>
      `;
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ELECTRIC_URL') return 'https://example.com/electric';
        return undefined;
      });

      const supplierCardMock = {
        length: 1,
        each: jest.fn(),
      };

      mockCheerio.load.mockReturnValue((selector: string) => {
        if (selector === '.supplier-card') {
          return supplierCardMock;
        }
        if (selector === 'div.dist-card') {
          return {
            length: 0,
            each: jest.fn(),
          };
        }
        return { length: 0 };
      });

      await service['fetchWeb']('electric');

      expect(mockCheerio.load).toHaveBeenCalledWith(htmlContent);
      expect(supplierCardMock.each).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle empty supplier cards', async () => {
      const htmlContent = '<html><body></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should call each on supplier-card elements', async () => {
      const htmlContent = `
        <html>
          <body>
            <div class="supplier-card">Card 1</div>
            <div class="supplier-card">Card 2</div>
            <div class="supplier-card">Card 3</div>
            <div class="supplier-card">Card 4</div>
          </body>
        </html>
      `;
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      const supplierCardMock = {
        length: 4,
        each: jest.fn(),
      };

      mockCheerio.load.mockReturnValue((selector: string) => {
        if (selector === '.supplier-card') {
          return supplierCardMock;
        }
        if (selector === 'div.dist-card') {
          return {
            length: 0,
            each: jest.fn(),
          };
        }
        return { length: 0 };
      });

      await service['fetchWeb']('gas');

      expect(supplierCardMock.each).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should process PECO dist-card elements', async () => {
      const htmlContent = `
        <html>
          <body>
            <div class="dist-card">
              <div class="name">PECO</div>
              <div>$0.10 per kwh</div>
              <div>1 Month</div>
            </div>
          </body>
        </html>
      `;
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ELECTRIC_URL') return 'https://example.com/electric';
        return undefined;
      });

      const distCardMock = {
        length: 1,
        each: jest.fn(),
      };

      mockCheerio.load.mockReturnValue((selector: string) => {
        if (selector === '.supplier-card') {
          return {
            length: 0,
            each: jest.fn(),
          };
        }
        if (selector === 'div.dist-card') {
          return distCardMock;
        }
        return { length: 0 };
      });

      await service['fetchWeb']('electric');

      expect(distCardMock.each).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should use peco.com URL for PECO provider', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div class="name">PECO</div>
              <div>$0.10 per kwh</div>
              <div>Term Length: 12 Months</div>
            </div>
          </body>
        </html>
      `;

      const cheerio = jest.requireActual('cheerio');
      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [];

      service['getDataFromNode'](element, $, 'electric', results);

      expect(mockPutlityService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PECO',
          url: 'https://www.peco.com/',
        }),
      );
    });

    it('should use peco.com URL for provider with PECO in name', () => {
      const htmlContent = `
        <html>
          <body>
            <div class="rate-card">
              <div class="name">PECO Energy Company</div>
              <div>$0.09 per kwh</div>
              <div>Term Length: 6 Months</div>
            </div>
          </body>
        </html>
      `;

      const cheerio = jest.requireActual('cheerio');
      const $ = cheerio.load(htmlContent);
      const element = $('.rate-card').get(0);
      const results: any = [];

      service['getDataFromNode'](element, $, 'electric', results);

      expect(mockPutlityService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PECO Energy Company',
          url: 'https://www.peco.com/',
        }),
      );
    });

    it('should extract price from dollar amount regex', async () => {
      const htmlContent =
        '<html><body><div class="supplier-card">Rate: $0.15390 per kwh</div></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockCheerio.load).toHaveBeenCalled();
    });

    it('should extract term length from months pattern', async () => {
      const htmlContent =
        '<html><body><div class="supplier-card">24 Months contract</div></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockCheerio.load).toHaveBeenCalled();
    });

    it('should handle Month to Month term pattern', async () => {
      const htmlContent =
        '<html><body><div class="supplier-card">Month to Month plan</div></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockCheerio.load).toHaveBeenCalled();
    });

    it('should prevent duplicate entries with same provider and price', async () => {
      const htmlContent = `
        <html>
          <body>
            <div class="supplier-card">Provider A $0.12</div>
            <div class="supplier-card">Provider A $0.12</div>
          </body>
        </html>
      `;
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should skip suppliers with Unknown provider name', async () => {
      const htmlContent =
        '<html><body><div class="supplier-card">$0.12 per kwh</div></body></html>';
      mockPage.content.mockResolvedValue(htmlContent);

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GAS_URL') return 'https://example.com/gas';
        return undefined;
      });

      mockCheerio.load.mockReturnValue(() => ({
        length: 0,
        each: jest.fn(),
      }));

      await service['fetchWeb']('gas');

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
