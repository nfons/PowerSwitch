import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentUtilityService } from './current-utility.service';
import { CurrentUtility } from './currentUtility.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CurrentUtility])],
  providers: [CurrentUtilityService],
  exports: [CurrentUtilityService],
})
export class CurrentUtilityModule {}
