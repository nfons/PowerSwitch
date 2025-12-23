const puppeteer = require('puppeteer');

(async () => {
  // 1. Launch the browser
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // The URL provided
  const url = 'https://www.papowerswitch.com/shop-for-rates-results?zip=18966&distributor=1182&distributorrate=R%20-%20Regular%20Residential%20Service&servicetype=residential&usage=700&min-price=&max-price=&offerPreferences%5B%5D=no_cancellation&offerPreferences%5B%5D=no_enrollment&offerPreferences%5B%5D=no_monthly&sortby=est_a';

  console.log("Visiting site...");

  // 2. Visit the URL and wait for network to be idle to ensure results load
  await page.goto(url, { waitUntil: 'networkidle2' });

  // 3. Parse the DOM to find the first 3 elements with class "company-info supplier"
  const rates = await page.evaluate(() => {
    // Select all elements with the class
    const elements = document.querySelectorAll('.supplier-card');

    function getRateCards() {
      // Get all div elements
      const allDivs = Array.from(elements);

      // Filter for divs that contain both "per kwh" and "Term Length"
      // These unique strings identify a valid rate offer card
      const potentialCards = allDivs.filter(div =>
        div.innerText.toLowerCase().includes('per kwh') &&
        div.innerText.toLowerCase().includes('term length')
      );

      // Filter out parent containers (keep only the specific card elements)
      // We do this by checking if a div contains another div from our list
      const rateCards = potentialCards.filter(card => {
        return !potentialCards.some(otherCard => card !== otherCard && card.contains(otherCard));
      });

      return rateCards;
    }

    const cards = getRateCards();
    const results = [];

    // Loop through the first 3 cards found
    for (let i = 0; i < Math.min(3, cards.length); i++) {
      const card = cards[i];
      const text = card.innerText;

      // 1. Extract Price
      // Looks for pattern like "$0.11024" or "$0.08"
      const priceMatch = text.match(/\$\d+\.\d+/);
      const price = priceMatch ? priceMatch[0] + " per kWh" : "Price not found";

      // 2. Extract Term Length
      // Looks for the line containing "Term Length" and cleans it
      let term = "Term not found";
      const termLine = text.split('\n').find(line => line.includes("Term Length"));
      if (termLine) {
        // Usually appears as "12 Months Term Length", we want just "12 Months"
        term = termLine.replace("Term Length", "").trim();
      }

      // 3. Extract Provider Name
      // The provider is usually the very first line of text or inside an Header/Link at the top
      // We split by newlines and take the first non-empty line that isn't a common UI label
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let provider = lines[0];

      // Cleanup: Sometimes provider and plan are on the same line separated by "—"
      if (provider.includes("—")) {
        provider = provider.split("—")[0].trim();
      }

      results.push({
        Provider: provider,
        Term: term,
        Price: price
      });
    }

    // Output the results in a table format
    console.table(results);

    // Also return the raw data
    return results;
  });

  // 4. Output the results
  console.log("Found top 3 results:");
  console.log(JSON.stringify(rates, null, 2));

  await browser.close();
})();