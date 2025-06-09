const scrapeFashionRecommendations = require('../utility/scraping');
const NodeCache = require('node-cache');
const recommendationCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const FashionQuiz = require("../models/fashion.models")

async function getFashionRecommendations(req, res) {
  try {
    const userInput = {
      bodyShape: req.body.bodyShape || 'apple',
      skinTone: req.body.skinTone || 'olive',
      occasion: req.body.occasion || 'casual',
      priceRange: req.body.priceRange || [50, 140],
      preferences: Array.isArray(req.body.preferences) ? req.body.preferences : 
      (req.body.preferences ? [req.body.preferences] : ['edgy'])
    };

    // Validate price range
    if (!Array.isArray(userInput.priceRange) || userInput.priceRange.length !== 2) {
      userInput.priceRange = [50, 140];
    }

    // Generate cache key based on input
    const cacheKey = JSON.stringify(userInput);

    // Check cache first
    const cachedResults = recommendationCache.get(cacheKey);
    if (cachedResults) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: cachedResults
      });
    }

    // Get fresh results
    const results = await scrapeFashionRecommendations(userInput);
    // console.log(results)

    // Cache the results
    if (results.length > 0) {
      recommendationCache.set(cacheKey, results);
    }

    const History = new FashionQuiz({
      userId: req.user._id,
      bodyShape: req.body.bodyShape || 'apple',
      skinTone: req.body.skinTone || 'olive',
      occasion: req.body.occasion || 'casual',
      priceRange: req.body.priceRange || [50, 140],
      preferences: Array.isArray(req.body.preferences) ? req.body.preferences : 
      (req.body.preferences ? [req.body.preferences] : ['edgy']),
      recommendations :results

    })

    await History.save();


    res.status(200).json({
      success: true,
      fromCache: false,
      data: results
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fashion recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Validation middleware
function validateFashionRequest(req, res, next) {
  const validBodyShapes = ['apple', 'pear', 'hourglass', 'rectangle','inverted'];
  const validSkinTones = ['fair', 'light', 'medium','olive','tan', 'dark'];
  const validOccasions = ['casual', 'formal', 'party', 'date', 'beach', 'winter'];

  if (req.body.bodyShape && !validBodyShapes.includes(req.body.bodyShape)) {
    return res.status(400).json({
      success: false,
      message: `Invalid bodyShape. Must be one of: ${validBodyShapes.join(', ')}`
    });
  }

  if (req.body.skinTone && !validSkinTones.includes(req.body.skinTone)) {
    return res.status(400).json({
      success: false,
      message: `Invalid skinTone. Must be one of: ${validSkinTones.join(', ')}`
    });
  }

  if (req.body.occasion && !validOccasions.includes(req.body.occasion)) {
    return res.status(400).json({
      success: false,
      message: `Invalid occasion. Must be one of: ${validOccasions.join(', ')}`
    });
  }

  if (req.body.priceRange) {
    if (!Array.isArray(req.body.priceRange) || req.body.priceRange.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'priceRange must be an array of two numbers [min, max]'
      });
    }
    if (typeof req.body.priceRange[0] !== 'number' || typeof req.body.priceRange[1] !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'priceRange values must be numbers'
      });
    }
    if (req.body.priceRange[0] > req.body.priceRange[1]) {
      return res.status(400).json({
        success: false,
        message: 'priceRange min must be less than max'
      });
    }
  }

  next();
}

const getHistory = async (req,res) =>{
  try {
    const id = req.user._id;
    if(!id){
      res.status(401).json({message:"You are unauthorised"});
    }

    const history = await FashionQuiz.find({
      userId : id
    });

    if(!history){
      res.status(202).json({message:"No previous history found!"})
    }

    res.status(200).json({
      data : history,
      message :"Your history"
    })
    
  } catch (error) {
    console.error("error in getting history");
    res.status(500).json({message :"Error in fetching history"})

    
  }

}

module.exports = {
  getFashionRecommendations,
  validateFashionRequest,
  getHistory
};