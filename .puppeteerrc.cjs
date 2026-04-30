const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Cache directory
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};