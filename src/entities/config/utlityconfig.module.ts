import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {UtilityConfigService} from "./utilityConfig.service";
import {UtilityConfig} from "./utlityConfig.entity";


@Module({
    imports: [TypeOrmModule.forFeature([UtilityConfig])],
    providers: [UtilityConfigService],
    exports: [UtilityConfigService]
})
export class UtilityConfigModule {}