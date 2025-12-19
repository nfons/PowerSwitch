import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PutlityService } from './putlity.service';
import { PUtility } from './putility.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PUtility])],
    providers: [PutlityService],
    exports: [PutlityService]
})
export class PutlityModule {}