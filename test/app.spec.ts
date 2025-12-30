import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PUtility } from '../src/entities/putility/putility.entity';
import { CurrentUtility } from '../src/entities/current_utility/currentUtility.entity';
import { PutlityService } from '../src/entities/putility/putlity.service';
import { CurrentUtilityService } from '../src/entities/current_utility/current-utility.service';
import { TasksService } from '../src/task.service';



jest.setTimeout(15000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let putlityService: PutlityService;
  let utilityConfigService: CurrentUtilityService;
  let mockTasksService: { onModuleInit: jest.Mock };
  let seededUtilities: PUtility[];
  let seededConfigs: CurrentUtility[];

  beforeEach(async () => {
    mockTasksService = { onModuleInit: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [PUtility, CurrentUtility],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    })
      .overrideProvider(TasksService)
      .useValue(mockTasksService)
      .overrideModule(AppModule)
      .useModule(AppModule)
      .compile();

    app = moduleFixture.createNestApplication();
    putlityService = moduleFixture.get(PutlityService);
    utilityConfigService = moduleFixture.get(CurrentUtilityService);
    await app.init();

    seededUtilities = [];
    for (const name of ['alpha', 'beta', 'omega']) {
      const entity = Object.assign(new PUtility(), {
        name,
        rate: 0.15,
        type: 'electricity',
        url: 'http://localhost',
      });
      seededUtilities.push(await putlityService.add(entity));
    }

    seededConfigs = [];
    for (const region of ['north', 'south']) {
      const config = Object.assign(new CurrentUtility(), {
        fields: { region },
        nextrun: new Date(),
        rate: 0.12,
        name: region,
        type: 'electricity',
      });
      seededConfigs.push(await utilityConfigService.add(config));
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return 200 Healthy when hitting /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('200 Healthy');
  });

  describe('putility tests', () => {
    it('/putlity (GET) should return all records', async () => {
      const res = await request(app.getHttpServer())
        .get('/putlity')
        .expect(200);
      const names = res.body.map((item: any) => item.name).sort();
      expect(names).toEqual(['alpha', 'beta', 'omega']);
    });

    it('/putlity/:id (GET) should return the requested record', async () => {
      const target = seededUtilities[0];
      const res = await request(app.getHttpServer())
        .get(`/putlity/${target.id}`)
        .expect(200);
      expect(res.body).toMatchObject({ id: target.id, name: target.name });
    });

    it('/putility (PUT) should create a new record', async () => {
      const putlity = { name: 'gamma', rate: 0.1, type: 'gas' };
      const res = await request(app.getHttpServer())
        .put('/putlity')
        .send(putlity)
        .expect(200);
      expect(res.text).toBe('Utility Record Created');
    });
  });

  describe('utilityConfig tests', () => {
    it('/config (GET) should return seeded configs', async () => {
      const res = await request(app.getHttpServer()).get('/config').expect(200);
      const regions = res.body.map((item: any) => item.fields.region).sort();
      expect(regions).toEqual(['north', 'south']);
    });

    it('/config/:id (GET) should return the requested config', async () => {
      const target = seededConfigs[0];
      const res = await request(app.getHttpServer())
        .get(`/config/${target.id}`)
        .expect(200);
      expect(res.body).toMatchObject({ id: target.id, fields: target.fields });
    });

    it('/config (PUT) should create a new config entry', async () => {
      const dto = {
        fields: { region: 'east' },
        nextrun: new Date().toISOString(),
        name: 'east',
        rate: 0.12,
        type: 'electricity',
      };
      const res = await request(app.getHttpServer())
        .put('/config')
        .send(dto)
        .expect(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.fields.region).toBe('east');
      const persisted = await utilityConfigService.findOne(res.body.id);
      expect(persisted).not.toBeNull();
    });

    it('/config/current/:type (GET) should return the latest config for given type', async () => {
      const res = await request(app.getHttpServer())
        .get('/config/current/electricity')
        .expect(200);
      // Expect the most recently inserted seeded config for type 'electricity' which has region 'south'
      expect(res.body).toMatchObject({ fields: { region: 'south' }, type: 'electricity' });
    });

    it('/config/current/:type (GET) should return 404 when type not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/config/current/gas')
        .expect(404);
      expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    });
  });
});
