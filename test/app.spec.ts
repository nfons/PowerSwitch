import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PUtility } from '../src/entities/putility/putility.entity';
import { UtilityConfig } from '../src/entities/config/utlityConfig.entity';
import { PutlityService } from '../src/entities/putility/putlity.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let putlityService: PutlityService;
  let seededUtilities: PUtility[] = [];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [PUtility, UtilityConfig],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    })
      .overrideModule(AppModule)
      .useModule(AppModule)
      .compile();

    app = moduleFixture.createNestApplication();
    putlityService = moduleFixture.get(PutlityService);
    await app.init();

    seededUtilities = [];
    for (const name of ['alpha', 'beta', "omega"]) {
      const entity = Object.assign(new PUtility(), { name, rate: 0.15, type: 'electricity' });
      seededUtilities.push(await putlityService.add(entity));
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('200 Healthy');
  });
  it('should return 200 Healthy when hitting /health', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('200 Healthy');
  });

  it('/putlity (GET) should return all records', async () => {
    const res = await request(app.getHttpServer())
      .get('/putlity')
      .expect(200);
    const names = res.body.map((item: any) => item.name).sort();
    expect(names).toEqual(['alpha', 'beta']);
  });

  it('/putlity/:id (GET) should return the requested record', async () => {
    const target = seededUtilities[0];
    const res = await request(app.getHttpServer())
      .get(`/putlity/${target.id}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: target.id, name: target.name });
  });
});
