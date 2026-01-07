import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';
import fetch from 'node-fetch';
import csv from 'csv-parser';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { PutlityService } from './entities/putility/putlity.service';
import { PUtility } from './entities/putility/putility.entity';
import { CurrentUtilityService } from './entities/current_utility/current-utility.service';
import { CurrentUtility } from './entities/current_utility/currentUtility.entity';
import { EmailService } from './email/email.service';

@Injectable()
export class TasksService {
  private readonly logger: Logger;
  private currentGasRates: any = new Array();
  private currentElectricRates: any = new Array();
  /*
    Default schedule to run the task every 1st day of the month at noon
    0 12 1 * *
    Utility Rates do not change often, we can save API calls by running this task once a month
     */
  public schedule: string = '0 0 15 * *'; // Rates should be out by then. 15th day of mo at midnight

  constructor(
    private readonly configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private putilityService: PutlityService,
    private cutilityService: CurrentUtilityService,
    private emailService: EmailService,
  ) {
    this.logger = new Logger(TasksService.name);
    const schedule =
      this.configService.get<string>('CRON_TIME') || this.schedule;
    const job = new CronJob(schedule, async () => {
      this.getUtilityRates();
    });
    this.currentGasRates = [];
    this.currentElectricRates = [];
    this.schedulerRegistry.addCronJob(TasksService.name, job);
    job.start();
  }

  onModuleInit() {
    this.getUtilityRates();
  }

  /**
   * Generates a Google search URL for the provided search term.
   *
   * @param {string} term - The search term to be used in the Google search query.
   * @return {string} The encoded Google search URL containing the search term.
   */
  private getGoogleUrl(term: string) {
    return `https://www.google.com/search?q=${encodeURIComponent(term)}`;
  }

  private parsePrice(priceStr) {
    if (!priceStr) return Infinity;
    // Remove '$' and other non-numeric characters (except decimal point)
    const cleanStr = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr);
  }

  private getDataFromNode(el: any, $: any, type: string, results: any) {
    const element = $(el);

    // Traverse up parents until we find a container that has "Term Length" inside it
    // This confirms we are inside a Rate Card
    let card = element.closest(':has(:contains("Term Length"))');

    if (card.length > 0) {
      // Provider
      // Providers are usually in an <img> alt attribute or a header tag (h2, h3)
      let provider = 'Unknown';
      const providerCard = card.find('.name').first();

      if (providerCard.length > 0) {
        provider = providerCard.text();
      }

      // Price
      // Look for the dollar amount near the "per kwh" text
      let price = '';
      // Get all text in the parent of the indicator (e.g., "$0.11390 per kwh")
      const priceText = card.text();
      const priceMatch = priceText.match(/\$\d+\.\d+/);
      if (priceMatch) {
        price = priceMatch[0].replace('$', '');
      }

      // Term
      // Default to 1 if not found
      let term = '1';
      const cardText = card.text();
      const termMatch = cardText.match(/(\d+\s+Months?|Month\s+to\s+Month)/i);
      if (termMatch) {
        term = termMatch[1];
        // We want integer values here to do compare at a later time
        if (term.includes('Months'))
          term = term.replace('Months', '').replace(' ', '');
        else if (term.includes('Month to Month')) term = '1';
      }

      // URL
      let provider_url = '';
      const link: any = card.find('div.second > a').first();
      if (link.length > 0) {
        provider_url = link.attr('href').toString();
      } else {
        // if no link, use google search
        provider_url = this.getGoogleUrl(provider);
      }
      // for peco, we just need to link to peco website
      if (provider.includes('PECO')) {
        provider_url = 'https://www.peco.com/';
      }

      // Prevent duplicates This was happening couple of times for some reason
      const isDuplicate = results.some(
        (r) => r.provider === provider && r.price === price,
      );

      if (!isDuplicate && provider !== 'Unknown') {
        let putilityEntity: PUtility = new PUtility();
        putilityEntity.name = provider;
        putilityEntity.rate = parseFloat(price);
        putilityEntity.type = type;
        putilityEntity.rateLength = parseInt(term);
        putilityEntity.url = provider_url;
        this.putilityService.add(putilityEntity);
        results.push(putilityEntity);
      }
    }
  }

  /**
   * Fetches utility rate data from a CSV file based on the specified type.
   *
   * @param {string} type - The type of utility rate data to fetch (e.g., 'gas' or 'electric').
   * @private
   */
  private async fetchCSV(type: string) {
    const URL =
      type === 'gas'
        ? this.configService.get('GAS_URL')
        : this.configService.get('ELECTRIC_URL');
    let results: any = [];

    try {
      this.logger.debug('Downloading CSV...');
      const response = await fetch(URL);

      if (!response.ok) {
        throw new Error(`Unexpected response ${response.statusText}`);
      }

      this.logger.debug('Parsing data...');

      response.body &&
        response.body
          .pipe(csv())
          .on('data', (data: any) => {
            // Find column keys containing "price" or "rate" case-insensitive
            let priceKey = Object.keys(data).find((k) =>
              k.toLowerCase().includes('price'),
            );

            if (!priceKey) {
              priceKey = Object.keys(data).find((k) =>
                k.toLowerCase().includes('rate'),
              );
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
            //  filter out stuff we don't like
            // remove results with price <= 0
            // remove results that have monthly fee, cancellation fee
            let filter = {
              'Cancellation Fee': true, // sometimes its blank, sometimes they put 0
              'Monthly Fee': 'Yes',
              'Monthly service fee amount': true, //sometimes its blank, sometimes they put 0
            };
            // remove results that have 0 for price...these seem to be old and outdataed data or something
            let sanitizeResults = results.filter((item) => {
              if (item.Price > 0) {
                for (let key in filter) {
                  switch (key) {
                    case 'Monthly Fee':
                      if (
                        item[key] === 'Yes' ||
                        (!isNaN(item[key]) && parseFloat(item[key]) > 0)
                      ) {
                        return false;
                      }
                      break;
                    case 'Cancellation Fee':
                    case 'Monthly service fee amount':
                      if (
                        item[key] !== '0' &&
                        item[key] !== '' &&
                        item[key] !== undefined &&
                        item[key] !== 'No'
                      ) {
                        return false;
                      }
                      break;
                  }
                }
                return item;
              }
            });
            // Get top 3
            results = sanitizeResults;
            const top3 = results.slice(0, 3);

            results = []; // reset our results
            top3.forEach((item) => {
              let rateLength = item['Term Length'] || '1';
              // clean up date
              if (rateLength == 0) rateLength = '1'; // usually for variable rates we will set to 1 month
              let putilityEntity: PUtility = new PUtility();
              putilityEntity.name = item.Supplier;
              putilityEntity.rate = item.Price;
              putilityEntity.type = type;
              putilityEntity.rateLength = rateLength;
              putilityEntity.url = this.getGoogleUrl(
                item['Contact Phone Number'] || item['Supplier'],
              );
              this.putilityService.add(putilityEntity); // add entry to db
              // add entry to currentRate
              this.logger.debug(
                'Added Putility entry to DB:',
                putilityEntity.name,
              );
            });
            return results;
          })
          .on('error', (err) => {
            this.logger.error('Error parsing CSV:', err.message);
          });
    } catch (error) {
      this.logger.error('Error fetching the CSV:', error.message);
    }
  }

  /**
   * Fetches utility rate data from a Web browser based on the specified type.
   *
   * @param {string} type - The type of utility rate data to fetch (e.g., 'gas' or 'electric').
   * @private
   */
  private async fetchWeb(type: string) {
    this.logger.debug('Fetching utility rates from web API for type:' + type);
    // 1. Launch Browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 2 Navigate to URL
    let url =
      type === 'gas'
        ? this.configService.get('GAS_URL')
        : this.configService.get('ELECTRIC_URL');
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 3 Fetch the raw HTML string (Requested Method)
    const html = await page.content();

    // 4 Parse HTML using Cheerio
    const $ = cheerio.load(html);
    const results: any = [];

    // Strategy: Find divs that has 'supplier-card' class attribute.
    // This sucks because if class name changes, we will need to update this code.
    const priceIndicators = $('.supplier-card');
    const pecoCard = $('div.dist-card'); // PECO card comes in this format
    // peco card does not have supplier-card class so we add it manually

    priceIndicators.each((i, el) => {
      if (results.length > 3) return; // Stop after finding 3. we could make this configurable
      this.getDataFromNode(el, $, type, results);
    });

    pecoCard.each((i, el) => {
      this.getDataFromNode(el, $, type, results);
    });
    await browser.close();
    return results;
  }

  /*
   Email alert for new best utility rate
   using nodemailer
   */
  private async sendEmail(type, utility: PUtility) {
    const rateprefix = type === 'gas' ? 'ccf' : 'kwh';
    const emailbody = `<h1>New best ${type} rate found</h1><h3>Supplier:</h3><strong>${utility.name}</strong> at ${utility.rate} ${rateprefix}, check out details <a href="${utility.url}">@ ${utility.url}</a>`;
    const emailTitle = `New Best ${type.toUpperCase()} Rate Alert from your PowerSwitch Instance`;
    this.logger.debug(
      'Sending email alert for new best ' +
        type +
        ' rate: ' +
        utility.name +
        ' at rate ' +
        utility.rate,
    );
    this.emailService.sendMail({
      to: this.configService.get<string>('GMAIL_USER') || '',
      subject: emailTitle,
      html: emailbody,
    });
  }

  /**
   * Retrieves utility rates for gas and electricity from either a CSV file or via a web call,
   * based on the configured API type. After retrieving the rates, the method compares them to
   * current rates and potentially sends alerts if new best rates are identified.
   *
   * @return {Promise<void>} A Promise that resolves when the utility rate processing and comparison are complete.
   */
  public async getUtilityRates() {
    // reset current rates, so we don't need to fetch from db
    this.currentGasRates = [];
    this.currentElectricRates = [];
    // check config to see if rates should use web or csv approach
    try {
      const apiType = (
        this.configService.get<string>('API_TYPE') || ''
      ).toLowerCase();
      if (apiType === 'csv') {
        this.logger.debug('Using CSV file to get utility rates');
        if (this.configService.get('GAS_URL')) {
          this.currentGasRates = await this.fetchCSV('gas');
        }
        if (this.configService.get('ELECTRIC_URL')) {
          this.currentElectricRates = await this.fetchCSV('electric');
        }
      } else {
        this.logger.debug('Using WEB call to get utility rates');
        if (this.configService.get('GAS_URL')) {
          this.currentGasRates = await this.fetchWeb('gas');
        }
        if (this.configService.get('ELECTRIC_URL')) {
          this.currentElectricRates = await this.fetchWeb('electric');
        }
      }
    } catch (error) {
      this.logger.error('Error in getUtilityRates:', error.message);
    }

    // After this is done, we need to compare the rates and see if we need to alert
    function compare(a, b) {
      if (a.rate < b.rate) return -1;
      if (a.rate > b.rate) return 1;
      return 0;
    }

    // sort the array, we technically might - should not need to, but will do it just in case.
    // its no that expensive since its only 3 elements
    this.currentGasRates.sort(compare);
    this.currentElectricRates.sort(compare);

    // best rate is now the 1st item in each array
    const bestGasRate = this.currentGasRates[0];
    const bestElectricRate = this.currentElectricRates[0];

    const currentElectric: any =
      await this.cutilityService.findCurrent('electric');
    const currentGas: any = await this.cutilityService.findCurrent('gas');

    if (currentGas === null || currentGas?.rate > bestGasRate?.rate) {
      this.logger.debug(
        `New best gas rate found: ${bestGasRate.name} at rate ${bestGasRate.rate}`,
      );
      // send email alert
      this.sendEmail('gas', bestGasRate);
    }
    if (
      currentElectric === null ||
      currentElectric?.rate > bestElectricRate?.rate
    ) {
      this.logger.debug(
        `New best electric rate found: ${bestElectricRate.name} at rate ${bestElectricRate.rate}`,
      );
      // send email alert
      this.sendEmail('electric', bestElectricRate);
    }
  }
}
