import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {CronJob} from 'cron';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    public schedule : string = '20 * * * * *'; // Default to every minute

    constructor(private  readonly configService: ConfigService, private schedulerRegistry: SchedulerRegistry ) {
        const schedule = this.configService.get<string>('CRON_TIME') || this.schedule;
        const job = new CronJob(schedule, async () => {
           this.logger.debug(`Running a task every ${schedule}`);
        });

        this.schedulerRegistry.addCronJob(TasksService.name, job);
        job.start();
    }
    /*
     We will use this method to call the Power switch website and get the new list of prices
     compare them to ours, and send out an alert
     */
    // @Cron('10 * * * * *')
    // handleCron() {
    //     this.logger.debug('Called when the current second is 45');
    // }
}
