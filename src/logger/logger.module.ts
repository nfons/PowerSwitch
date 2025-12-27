import { Global, Module } from '@nestjs/common';
import { LoggerService } from '@nestjs/common';
import { CustomLogger } from './logger.service';

@Global()
@Module({
  providers: [{ provide: LoggerService, useClass: CustomLogger }],
  exports: [LoggerService],
})
export class LoggerModule {}
