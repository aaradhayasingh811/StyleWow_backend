const mongoose = require('mongoose');
const { Schema } = mongoose;


const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
 
  description: String,
  price: {
    type: Number,
    required: true
  },
  image: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  brand:{
    type :String
  },
  link:{
    type :String
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;