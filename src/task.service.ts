import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {CronJob} from 'cron';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    public schedule : string = '*/1 * * * * *'; // Default to every minute

    constructor(private  readonly configService: ConfigService, private schedulerRegistry: SchedulerRegistry ) {
        const name = 'alertJob';
        const seconds = '5';
        const job = new CronJob('* * * * * *', async () => {
            console.log('Running a task every minute');
        });

        this.schedulerRegistry.addCronJob(name, job);
        job.start();

        this.logger.warn(
          `job ${name} added for each minute at ${seconds} seconds!`,
        );
    }
    /*
     We will use this method to call the Power switch website and get the new list of prices
     compare them to ours, and send out an alert
     */
    @Cron('10 * * * * *')
    handleCron() {
        this.logger.debug('Called when the current second is 45');
    }
}
