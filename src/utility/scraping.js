const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const getConfig = (priceRange = [0, 10000]) => ({
  maxProducts: 15,
  minPrice: priceRange[0],
  maxPrice: priceRange[1],
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
});

const myntraTerm = ({ bodyShape, skinTone, occasion }) => {
  const bodyShapeMap = {
    apple: "apple shape",
    pear: "pear shape",
    hourglass: "hourglass figure",
    rectangle: "rectangle shape",
    inverted: "inverted triangle",
  };
  return `${
    bodyShapeMap[bodyShape] || bodyShape
  } ${skinTone} ${occasion} outfit ideas for women`;
};

const generateSearchTerms = ({ bodyShape, skinTone, occasion }) => {
  const bodyShapeStyles = {
    apple: "empire waist A-line wrap",
    pear: "fit and flare bootcut wide-leg",
    hourglass: "belted bodycon pencil",
    rectangle: "ruffled peplum layered",
    inverted: "A-line full-sleeve light"
  };

  const skinToneColors = {
    fair: "pastel jewel-tone",
    medium: "earth-tone burgundy mustard",
    dark: "vibrant neon royal-blue"
  };

  const occasionTypes = {
    casual: "top t-shirt jeans shirt",
    formal: "blazer trousers pencil-skirt",
    party: "cocktail-dress sequin evening-gown",
    wedding: "maxi-dress lehenga saree",
    office: "blouse work-dress formal-pants"
  };

  return `${occasionTypes[occasion] || occasion} ${
    bodyShapeStyles[bodyShape] || ''
  } ${
    skinToneColors[skinTone] || ''
  } for women`.trim();
};

const autoScroll = async (page, maxScrolls = 20) => {
  console.log("Scrolling the page...");
  await page.evaluate(async (maxScrolls) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let scrolls = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;
        if (scrolls >= maxScrolls || totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, maxScrolls);
};

const calculateMatchScore = (product, preferences) => {
  let score = 0;
  preferences.forEach((pref) => {
    if (
      product.title.toLowerCase().includes(pref.toLowerCase()) ||
      product.description.toLowerCase().includes(pref.toLowerCase())
    ) {
      score++;
    }
  });
  return score;
};

const parseProducts = ($, selector, site, config) => {
  const results = [];
  
  $(selector).each((_, el) => {
    let title = "";
    let link = "";
    let image = "";
    let priceText = "";

    try {
      if (site === "amazon") {
        title = $(el).find("h2.a-size-base-plus span").first().text().trim();
        link = `https://www.amazon.in${$(el)
          .find("a.a-link-normal.s-no-hover.s-underline-text.s-underline-link-text.s-link-style.a-text-normal")
          .attr("href")}`;
        image = $(el).find("img.s-image").attr("src") || "";
        priceText = $(el)
          .find("span.a-price-whole")
          .text()
          .replace(/[₹,]/g, "")
          .trim();
      } 
      else if (site === "myntra") {
        const brand = $(el).find("h3.product-brand").text().trim();
        const productName = $(el).find("h4.product-product").text().trim();
        title = `${brand} ${productName}`;
        const relativeLink = $(el).find("a").attr("href");
        link = relativeLink ? `https://www.myntra.com${relativeLink}` : "";
        image = $(el).find("img.img-responsive").attr("src") || "";
        priceText = $(el)
          .find("span.product-discountedPrice")
          .text()
          .replace(/[^0-9]/g, "")
          .trim();
        console.log(priceText)
      } 
      else if (site === "flipkart") {
        const brand = $(el).find(".syl9yP").text().trim();
        const productName = $(el).find("a.WKTcLC").text().trim();
        title = `${brand} ${productName}`;
        const relativeLink = $(el).find("a.WKTcLC").attr("href");
        link = relativeLink ? `https://www.flipkart.com${relativeLink}` : "";
        image = $(el).find("img._53J4C-").attr("src") || "";
        priceText = $(el)
          .find(".Nx9bqj")
          .first()
          .text()
          .replace(/[₹,]/g, "")
          .trim();
      }

      const price = parseInt(priceText, 10) || 0;
      const brand = site;

      if (title && !isNaN(price) ){
        if (price >= config.minPrice && price <= config.maxPrice) {
          results.push({
            title,
            image,
            link,
            price,
            description: title,
            brand
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing product for ${site}:`, error);
    }
  });

  return results;
};

const scrapeAmazon = async (query, config) => {
  console.log("Starting Amazon scraping...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(config.userAgent);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "image", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&rh=p_36:${config.minPrice * 100}-${config.maxPrice * 100}`;
    console.log("Navigating to:", searchUrl);
    
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    
    await autoScroll(page);
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const products = parseProducts(
      $,
      'div[data-component-type="s-search-result"]',
      "amazon",
      config
    );
    
    return products.slice(0, config.maxProducts);
  } catch (err) {
    console.error("Amazon scraping error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
};

const scrapeFlipkart = async (query, config) => {
  console.log("Starting Flipkart scraping...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.setUserAgent(config.userAgent);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    console.log("Navigating to:", searchUrl);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    // Close login popup if exists
    try {
      await page.waitForSelector("._2KpZ6l._2doB4z", { timeout: 5000 });
      await page.click("._2KpZ6l._2doB4z");
      console.log("Closed Flipkart login popup");
    } catch (e) {
      console.log("No login popup");
    }

    await autoScroll(page);
    const content = await page.content();
    const $ = cheerio.load(content);

    const products = parseProducts($, "._1sdMkc.LFEi7Z", "flipkart", config);
    return products.slice(0, config.maxProducts);
  } catch (err) {
    console.error("Flipkart scraping error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
};

// const scrapeMyntra = async (query, config) => {
//   console.log("Starting Myntra scraping...");
//   const browser = await puppeteer.launch({ headless: "new" });
//   const page = await browser.newPage();

//   try {
//     await page.setUserAgent(config.userAgent);
//     await page.setRequestInterception(true);
//     page.on("request", (req) => {
//       if (["stylesheet", "image", "font"].includes(req.resourceType())) {
//         req.abort();
//       } else {
//         req.continue();
//       }
//     });

//     const url = `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`;
//     console.log("Navigating to:", url);
    
//     await page.goto(url, {
//       waitUntil: "domcontentloaded",
//       timeout: 60000
//     });

//     // Wait for products to load
//     try {
//       await page.waitForSelector('.product-base', { timeout: 10000 });
//     } catch (e) {
//       console.log("Products didn't load within timeout");
//     }

//     await autoScroll(page);
//     const content = await page.content();
//     const $ = cheerio.load(content);
    
//     const products = parseProducts($, "li.product-base", "myntra", config);
//     console.log(`${products.length} products found on Myntra`);
//     return products.slice(0, config.maxProducts);
//   } catch (error) {
//     console.error("Myntra scraping failed:", error.message);
//     return [];
//   } finally {
//     await browser.close();
//   }
// };

const scrapeMyntra = async (query,config) => {
  console.log("Starting Myntra scraping...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent(config.userAgent);

  try {
    const url = `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`
    console.log("Navigating to:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await autoScroll(page);

    const currentUrl = page.url();
    console.log("Current URL after navigation:", currentUrl);

    await page.screenshot({ path: "myntra_debug.png", fullPage: true });

    const content = await page.content();
    const $ = cheerio.load(content);
    console.log("hit"); // <- should now run
    const products = parseProducts($, "li.product-base", "myntra",config);
    console.log(products.length, "products found on myntra");
    return products.slice(0, config.maxProducts);
  } catch (error) {
    console.error("Myntra scraping failed:", error.message);
    return [];
  } finally {
    await browser.close();
  }
};


const scrapeFashionRecommendations = async ({
  bodyShape,
  skinTone,
  occasion,
  preferences = [],
  priceRange = [0, 10000]
}) => {
  console.log(priceRange,"price range")
  if (!Array.isArray(priceRange)) {
    throw new Error('priceRange must be an array [min, max]');
  }

  const config = getConfig(priceRange);
  const searchQuery = generateSearchTerms({ bodyShape, skinTone, occasion });
  const searchMyn = myntraTerm({bodyShape,skinTone,occasion});
  console.log("Search query:", searchQuery);

  try {
    const [amazon, flipkart, myntra] = await Promise.all([
      scrapeAmazon(searchQuery, config),
      scrapeFlipkart(searchQuery, config),
      scrapeMyntra(searchMyn, config),
    ]);

    // Combine and score products
    const allProducts = [...amazon, ...flipkart, ...myntra];
    allProducts.forEach(p => {
      p.matchScore = calculateMatchScore(p, preferences);
    });

    // Sort by score first, then interleave by source
    const sorted = allProducts.sort((a, b) => b.matchScore - a.matchScore);
    const bySource = {
      amazon: sorted.filter(p => p.brand === "amazon"),
      flipkart: sorted.filter(p => p.brand === "flipkart"),
      myntra: sorted.filter(p => p.brand === "myntra"),
    };

    // Interleave results
    const mixedResults = [];
    const maxLength = Math.max(
      bySource.amazon.length,
      bySource.flipkart.length,
      bySource.myntra.length
    );

    for (let i = 0; i < maxLength; i++) {
      if (i < bySource.amazon.length) mixedResults.push(bySource.amazon[i]);
      if (i < bySource.flipkart.length) mixedResults.push(bySource.flipkart[i]);
      if (i < bySource.myntra.length) mixedResults.push(bySource.myntra[i]);
    }

    const finalResults = mixedResults.slice(0, 3*config.maxProducts);
    console.log(`Returning top ${finalResults.length} products`);
    return finalResults;
  } catch (error) {
    console.error("Recommendation Engine Error:", error.message);
    return [];
  }
};

module.exports = scrapeFashionRecommendations;