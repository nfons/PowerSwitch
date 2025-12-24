const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testsearch2(){
  // 1. Launch Browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 2. Navigate to URL
  let url = 'https://www.papowerswitch.com/shop-for-rates-results/?zip=18966&distributor=1182&distributorrate=R%20-%20Regular%20Residential%20Service&servicetype=residential&usage=700&min-price=&max-price=&offerPreferences%5B%5D=no_cancellation&offerPreferences%5B%5D=no_enrollment&offerPreferences%5B%5D=no_monthly&sortby=est_a';
  url = 'https://www.pagasswitch.com/shop-for-rates/?zipcode=18966&serviceType=residential&distributor=4422&usage=100&min-price=&max-price=&ratePreferences%5B%5D=fixed&offerPreferences%5B%5D=no_cancellation&offerPreferences%5B%5D=no_deposit&offerPreferences%5B%5D=no_monthly&sortby=est_a';
  console.log('Navigating to page...');
  await page.goto(url, { waitUntil: 'networkidle2' });

  // 3. Fetch the raw HTML string (Requested Method)
  console.log('Fetching page content...');
  const html = await page.content();

  // 4. Parse HTML using Cheerio
  const $ = cheerio.load(html);
  const results = [];

  // Strategy: Find divs that has 'supplier-card' class attribute.
  // This sucks because if class name changes, we will need to update this code.
  const priceIndicators = $('.supplier-card');
  const pecoCard = $('div.dist-card') // PECO card comes in this format
   // peco card does not have supplier-card class so we add it manually

  priceIndicators.each((i, el) => {
    if (results.length >= 3) return false; // Stop after finding 3. we could make this configurable
    getDataFromNode(el);
  });

  pecoCard.each((i, el) => {
    getDataFromNode(el);
  })
  function getDataFromNode(el) {
    const element = $(el);

    // Traverse up parents until we find a container that has "Term Length" inside it
    // This confirms we are inside a Rate Card
    let card = element.closest(':has(:contains("Term Length"))');

    if (card.length > 0) {
      // Provider
      // Providers are usually in an <img> alt attribute or a header tag (h2, h3)
      let provider = "Unknown";
      const providerCard = card.find('.name').first();

      if (providerCard.length > 0) {
        provider = providerCard.text();
      }



      // Price
      // Look for the dollar amount near the "per kwh" text
      let price = "";
      // Get all text in the parent of the indicator (e.g., "$0.11390 per kwh")
      const priceText = card.text();
      const priceMatch = priceText.match(/\$\d+\.\d+/);
      if (priceMatch) {
        price = priceMatch[0].replace('$', '');
      }

      // Term
      // Default to 1 if not found
      let term = "1";
      const cardText = card.text();
      const termMatch = cardText.match(/(\d+\s+Months?|Month\s+to\s+Month)/i);
      if (termMatch) {
        term = termMatch[1];
        // We want integer values here to do compare at a later time
        if (term.includes('Months')) term = term.replace('Months', '').replace(" ", '');
        else if (term.includes('Month to Month')) term = '1';
      }

      // URL
      let provider_url = "";
      const link = card.find('div.second > a').first();
      if (link.length > 0) {
        provider_url = link.attr('href');
      }

      // Prevent duplicates This was happening couple of times for some reason
      const isDuplicate = results.some(r => r.provider === provider && r.price === price);

      if (!isDuplicate && provider !== "Unknown") {
        results.push({
          provider,
          termLength: term,
          price,
          url: provider_url
        });
      }
    }
  }
  console.log('Results:');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

testsearch2();