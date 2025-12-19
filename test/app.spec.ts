import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PUtility } from '../src/entities/putility/putility.entity';
import { UtilityConfig } from '../src/entities/config/utlityConfig.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

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
    await app.init();
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
});
