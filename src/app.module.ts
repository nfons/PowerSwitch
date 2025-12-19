import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PUtility } from './entities/putility/putility.entity';
import {PutlityModule} from './entities/putility/putlityModule';
import { DataSource } from 'typeorm';
import {PutlityService} from "./entities/putility/putlity.service";
import {UtilityConfig} from "./entities/config/utlityConfig.entity";
import {UtilityConfigModule} from "./entities/config/utlityconfig.module";
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'powerswitch.db',
      entities: [PUtility, UtilityConfig],
      synchronize: true, // I think this is not prod-friendly...but will tackle that later
      logging: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend', 'build'),
    }), PutlityModule, UtilityConfigModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private  dataSource: DataSource) {}
}
