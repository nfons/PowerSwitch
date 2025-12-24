import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {CronJob} from 'cron';
import fetch from 'node-fetch';
import csv from 'csv-parser';

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


    private  parsePrice(priceStr) {
      if (!priceStr) return Infinity;
      // Remove '$' and other non-numeric characters (except decimal point)
      const cleanStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(cleanStr);
    }

    private async fetchCSV(type: string){

      const URL = type === 'gas' ? this.configService.get('GAS_URL') : this.configService.get('ELECTRIC_URL');
      let results: any = [];

      try {
        this.logger.debug('Downloading CSV...');
        const response = await fetch(URL);

        if (!response.ok) {
          throw new Error(`Unexpected response ${response.statusText}`);
        }

        this.logger.debug('Parsing data...');

        response.body && response.body.pipe(csv())
          .on('data', (data: any) => {
            // Find column keys containing "price" or "rate" case-insensitive
            let priceKey = Object.keys(data).find(k => k.toLowerCase().includes('price'));

            if (!priceKey) {
              priceKey = Object.keys(data).find(k => k.toLowerCase().includes('rate'));
            }

            // If found, parse and store
            if (priceKey && data[priceKey]) {
              data[priceKey] = this.parsePrice(data[priceKey]);
              results.push(data);
            }
          })
          .on('end', async () => {
            // Sort by numeric price (Ascending)
            results.sort((a: any, b: any) => a.Price - b.Price);
            // remove results that have 0 for price...these seem to be old and outdataed data or something
            let sanitizeResults = results.filter((item) => {
              if(item.Price > 0) {
                return item;
              }
            });
            // Get top 3
            results = sanitizeResults;
            const top3 = results.slice(0, 3);

            results = []; // reset our results
            top3.forEach((item) => {
              let rateLength = item["Term Length"] || '1';
              // clean up date
              if (rateLength == 0) rateLength = '1'; // usually for variable rates we will set to 1 month
              let termToSearch = '';
              termToSearch = encodeURIComponent(item['Supplier'])
              if(item['Contact Phone Number']) {
                termToSearch = encodeURIComponent(item['Contact Phone Number']);
              }
              // store url as google result
              results.push({
                name: item.Supplier,
                type,
                rate: item.Price,
                rateLength,
                url: `https://www.google.com/search?q=${termToSearch}`
              });
            });
            this.logger.debug(results);

          })
          .on('error', (err) => {
            this.logger.error('Error parsing CSV:', err.message);
          });

      } catch (error) {
        this.logger.error('Error fetching the CSV:', error.message);
      }
    }
    private async getUtilityRates() {
      // check config to see if rates should use web or csv approach
      if (this.configService.get('API_TYPE') === 'web') {
          this.logger.debug('Using WEB call to get utility rates');
      }  else {
          this.logger.debug('Using CSV file to get utility rates');
          if(this.configService.get('GAS_URL')) {
           await this.fetchCSV('gas');
          }
          if(this.configService.get('ELECTRIC_URL')) {
            await this.fetchCSV('electric')
          }
      }
    }
}
