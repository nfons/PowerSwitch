import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PUtility } from './entities/putility/putility.entity';
import { PutlityModule } from './entities/putility/putlityModule';
import { DataSource } from 'typeorm';
import { PutlityService } from './entities/putility/putlity.service';
import { CurrentUtility } from './entities/current_utility/currentUtility.entity';
import { CurrentUtilityModule } from './entities/current_utility/currentUtility.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TasksService } from './task.service';
import { ScheduleModule } from '@nestjs/schedule';

const dbConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    type: 'better-sqlite3',
    database: configService.get<string>('DB_TABLE') || 'powerswitch.db',
    entities: [PUtility, CurrentUtility],
    synchronize: true,
    logging: false,
  }),
  inject: [ConfigService],
});

@Module({
  imports: [
    dbConfig,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend', 'build'),
    }),
    ScheduleModule.forRoot(),
    PutlityModule,
    CurrentUtilityModule,
  ],
  controllers: [AppController],
  providers: [AppService, TasksService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {
  }
}
