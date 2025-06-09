const mongoose = require('mongoose');

const fashionQuizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bodyShape: {
    type: String,
    enum: ['hourglass', 'pear', 'apple', 'rectangle', 'inverted'],
    required: true
  },
  skinTone: {
    type: String,
    enum: ['fair', 'light', 'medium', 'olive', 'tan', 'dark'],
    required: true
  },
  occasion: {
    type: String,
    enum: ['casual', 'formal', 'party', 'date', 'beach'],
    required: true
  },
  priceRange: {
    type :Array
  },
  preferences: {
    type: [String],
    enum: ['minimalist', 'bohemian', 'classic', 'edgy', 'romantic', 'sporty'],
    default: []
  },
  recommendations: {
    type : Array
  }
  ,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
fashionQuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FashionQuiz = mongoose.model('FashionQuiz', fashionQuizSchema);

module.exports = FashionQuiz;