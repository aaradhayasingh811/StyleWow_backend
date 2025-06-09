const puppeteer = require('puppeteer');
const fs = require('fs');

async function findChrome() {
  // List all possible Chrome locations
  const possiblePaths = [
    // Render.com paths
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    
    // Common Linux paths
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chrome',
    
    // Local development path (Puppeteer's downloaded Chrome)
    puppeteer.executablePath(),
    
    // Windows paths (if you ever need them)
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  // Check each path until we find one that exists
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        console.log(`✓ Found Chrome at: ${path}`);
        return path;
      }
    } catch (err) {
      console.log(`✗ Not found: ${path}`);
    }
  }

  // Last resort: Try letting Puppeteer find it automatically
  try {
    const autoPath = puppeteer.executablePath();
    console.log(`ℹ Trying Puppeteer's default path: ${autoPath}`);
    return autoPath;
  } catch (err) {
    throw new Error('❌ Chrome not found in any standard location. Please install Chrome or Chromium.');
  }
}

const launchBrowser = async () => {
  const executablePath = await findChrome();
  
  return puppeteer.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  });
};

module.exports = launchBrowser;