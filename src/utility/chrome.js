// const puppeteer = require('puppeteer');
// const path = require('path');
// const fs = require('fs');

// async function getBrowserPath() {
//   const basePath = '/mnt/data/puppeteer-cache';
//   const version = '137.0.7151.55'; // This matches Puppeteer's expected Chrome version
//   const executablePath = path.join(basePath, 'chrome', `linux-${version}`, 'chrome-linux', 'chrome');

//   if (!fs.existsSync(executablePath)) {
//     throw new Error('❌ Chrome not found at: ' + executablePath);
//   }

//   return executablePath;
// }

// const launchBrowser = async () => {
//   const executablePath = await getBrowserPath();

//   return puppeteer.launch({
//     headless: true,
//     executablePath,
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });
// };

// module.exports = launchBrowser;

const puppeteer = require('puppeteer');

async function getBrowserPath() {
  // On Render.com, Chrome is pre-installed here:
  const renderChromePath = '/usr/bin/google-chrome';
  
  // For local development, use Puppeteer's downloaded Chrome
  const localChromePath = puppeteer.executablePath();

  // Check if we're on Render.com
  if (process.env.RENDER) {
    return renderChromePath;
  }
  
  return localChromePath;
}

const launchBrowser = async () => {
  return puppeteer.launch({
    headless: 'new', // Recommended new headless mode
    executablePath: await getBrowserPath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Important for Render.com's limited memory
      '--single-process' // May help in memory-constrained environments
    ]
  });
};

module.exports = launchBrowser;