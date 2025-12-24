import fetch from 'node-fetch';
import csv from 'csv-parser';
import puppeteer from 'puppeteer';

let URL = 'https://www.pagasswitch.com/umbraco/Api/ShopApi/RateCSV?id=4422&servicetype=residential';
URL = 'https://www.papowerswitch.com/umbraco/Api/ShopApi/RateCSV?id=1182&servicetype=residential&ratetype=R%20-%20Regular%20Residential%20Service';
// Function to clean and parse the price string into a number
const parsePrice = (priceStr) => {
  if (!priceStr) return Infinity;
  // Remove '$' and other non-numeric characters (except decimal point)
  const cleanStr = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleanStr);
};

async function getTopRates(type) {
  let results = [];

  try {
    console.log('Downloading CSV...');
    const response = await fetch(URL);

    if (!response.ok) {
      throw new Error(`Unexpected response ${response.statusText}`);
    }

    console.log('Parsing data...');

    response.body.pipe(csv())
      .on('data', (data) => {
        // Find column keys containing "price" or "rate" case-insensitive
        let priceKey = Object.keys(data).find(k => k.toLowerCase().includes('price'));

        if (!priceKey) {
          priceKey = Object.keys(data).find(k => k.toLowerCase().includes('rate'));
        }

        // If found, parse and store
        if (priceKey && data[priceKey]) {
          data[priceKey] = parsePrice(data[priceKey]);
          results.push(data);
        }
      })
      .on('end', async () => {
        // Sort by numeric price (Ascending)
        results.sort((a, b) => a.Price - b.Price);
        // remove results that have 0 for price...these seem to be old and outdataed data or something
        let sanitizeResults = results.filter((item) => {
          if(item.Price > 0) {
            return item;
          }
        });
        console.log(`Found ${sanitizeResults.length} valid results.`);
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
        console.log(results);

      })
      .on('error', (err) => {
        console.error('Error parsing CSV:', err.message);
      });

  } catch (error) {
    console.error('Error fetching the CSV:', error.message);
  }
}

getTopRates('gas');