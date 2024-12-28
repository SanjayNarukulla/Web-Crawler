const puppeteer = require("puppeteer");
const {
  writeJSONToFile,
  getUserAgent,
  filterProductUrls,
  extractUrlsFromHTML,
} = require("./utils");
const fs = require("fs");
const path = require("path");

const productPatterns = [
  /\/product\//,
  /\/item\//,
  /\/p\//,
  /\/dp\//,
  /\/gp\//,
  /\/products\//,
  /\/items\//,
  /\/product-details\//,
  /\/offer\//,
  /\/store\//,
  /\/catalog\/.*\/dp\//,
  /\/cat\/.*\/product\//,
];

const fetchWithScrolling = async (page, url) => {
  console.log(`Crawling domain: ${url}`);
  try {
    await page.setUserAgent(getUserAgent());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    do {
      previousHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      try {
        await page.waitForSelector(
          ".product-grid, .product-list, .loading, .s-product-grid, .search-results",
          {
            timeout: 30000,
            visible: true,
          }
        );
      } catch {
        console.warn(`Fallback: waiting for body content on ${url}`);
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 2000))
        );
      }

      scrollAttempts++;
    } while (
      (await page.evaluate(() => document.body.scrollHeight)) >
        previousHeight &&
      scrollAttempts < maxScrollAttempts
    );

    return await page.content();
  } catch (error) {
    console.error(`Error crawling domain ${url}:`, error);
    return "";
  }
};

const crawlDomain = async (browser, domain) => {
  const page = await browser.newPage();
  const html = await fetchWithScrolling(page, domain);
  const urls = extractUrlsFromHTML(html);
  console.log(`Extracted ${urls.length} URLs from ${domain}`);

  const productUrls = filterProductUrls(urls, productPatterns);
  console.log(`Filtered ${productUrls.length} Product URLs on ${domain}`);

  await page.close();
  return productUrls;
};

const crawlAllDomains = async (domains) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-http2"],
  });
  const results = {};

  const crawlPromises = domains.map(async (domain) => {
    try {
      const productUrls = await crawlDomain(browser, domain);
      results[domain] = productUrls;
      console.log(`Found ${productUrls.length} product URLs on ${domain}`);
    } catch (error) {
      console.error(`Error crawling ${domain}:`, error);
      results[domain] = [];
    }
  });

  await Promise.all(crawlPromises);
  await browser.close();
  return results;
};

const crawlDomainWithRetries = async (browser, domain, retries) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await crawlDomain(browser, domain);
    } catch (error) {
      console.error(
        `Attempt ${attempt} failed for ${domain}: ${error.message}`
      );
      if (attempt === retries) throw error;
    }
  }
};

const startCrawl = async () => {
  const domains = [
    "https://www.flipkart.com",
    "https://www.amazon.in",
    "https://www.meesho.com",
    "https://www.snapdeal.com",
    "https://www.jabong.com",
    "https://www.paytmmall.com",
  ];

  try {
    const results = await crawlAllDomains(domains);
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
    const outputPath = path.join(
      __dirname,
      "output",
      `discovered_urls_${timestamp}.json`
    );
    writeJSONToFile(outputPath, results);
  } catch (error) {
    console.error("Error during crawl:", error);
  }
};

startCrawl();
