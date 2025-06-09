const puppeteer = require('puppeteer');
const fs = require('fs');

async function getBrowserPath() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  // fallback to Puppeteer's bundled chromium path
  const puppeteerPath = puppeteer.executablePath();
  if (fs.existsSync(puppeteerPath)) {
    return puppeteerPath;
  }

  throw new Error('❌ Chrome not found in any standard location');
}

const launchBrowser = async () => {
  const executablePath = await getBrowserPath();

  return puppeteer.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
};

module.exports = launchBrowser;
