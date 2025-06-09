const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function getBrowserPath() {
  const basePath = '/mnt/data/puppeteer-cache';
  const version = '137.0.7151.55'; // This matches Puppeteer's expected Chrome version
  const executablePath = path.join(basePath, 'chrome', `linux-${version}`, 'chrome-linux', 'chrome');

  if (!fs.existsSync(executablePath)) {
    throw new Error('❌ Chrome not found at: ' + executablePath);
  }

  return executablePath;
}

const launchBrowser = async () => {
  const executablePath = await getBrowserPath();

  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
};

module.exports = launchBrowser;
