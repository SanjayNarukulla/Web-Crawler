const fs = require("fs");
const path = require("path");

/**
 * Writes data to a JSON file.
 * @param {string} filePath - The file path to write data to.
 * @param {Object} data - The data to write to the file.
 */
const writeJSONToFile = (filePath, data) => {
  try {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error(`Failed to write data to file: ${filePath}`, error);
  }
};

/**
 * Generates a user agent string to mimic a real browser.
 * This can be used to reduce the likelihood of being blocked.
 * @returns {string} A browser-like user agent string.
 */
const getUserAgent = () => {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";
};

/**
 * Filters and returns unique product URLs based on a set of patterns.
 * @param {Array<string>} urls - A list of URLs to filter.
 * @param {Array<RegExp>} patterns - Patterns to identify product URLs.
 * @returns {Array<string>} A list of unique product URLs.
 */
const filterProductUrls = (urls, patterns) => {
  const productUrls = urls.filter((url) =>
    patterns.some((pattern) => pattern.test(url))
  );
  return [...new Set(productUrls)];
};

/**
 * Extracts all URLs from a given HTML string.
 * @param {string} html - The HTML content.
 * @returns {Array<string>} A list of extracted URLs.
 */
const extractUrlsFromHTML = (html) => {
  const regex = /https?:\/\/[^\s"']+/g;
  return html.match(regex) || [];
};

module.exports = {
  writeJSONToFile,
  getUserAgent,
  filterProductUrls,
  extractUrlsFromHTML,
};
