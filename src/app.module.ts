import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PUtility } from './entities/putility/putility.entity';
import {PutlityModule} from './entities/putility/putlityModule';
import { DataSource } from 'typeorm';
import {PutlityService} from "./entities/putility/putlity.service";
import {CurrentUtility} from "./entities/current_utility/currentUtility.entity";
import {CurrentUtilityModule} from "./entities/current_utility/currentUtility.module";
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'powerswitch.db',
      entities: [PUtility, CurrentUtility],
      synchronize: true, // I think this is not prod-friendly...but will tackle that later
      logging: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend', 'build'),
    }),
    ConfigModule.forRoot( { isGlobal: true }), PutlityModule, CurrentUtilityModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private  dataSource: DataSource) {}
}
