import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {CronJob} from 'cron';

@Injectable()
export class TasksService {
    private readonly logger: Logger

    /*
    Default schedule to run the task every 1st day of the month at noon
    0 12 1 * *
    Utility Rates do not change often, we can save API calls by running this task once a month
     */
    public schedule : string = CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON;

    constructor(private  readonly configService: ConfigService, private schedulerRegistry: SchedulerRegistry ) {
        this.logger  = new Logger(TasksService.name);
        const schedule = this.configService.get<string>('CRON_TIME') || this.schedule;
        const job = new CronJob(schedule, async () => {
          this.getUtilityRates();
        });

        this.schedulerRegistry.addCronJob(TasksService.name, job);
        job.start();
    }


    private async getUtilityRates() {
      // check config to see if rates should use web or csv approach
      if (this.configService.get('API_TYPE') === 'web') {
          this.logger.debug('Using WEB call to get utility rates');
      }  else {
          this.logger.debug('Using CSV file to get utility rates');
      }
    }
}
