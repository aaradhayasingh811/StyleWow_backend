const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjdLBPtVBiGPQ4LrKanWvkPFbQTTcnvGoOEg&s'
  },
  bodyShape: {
    type: String,
    enum: ['hourglass', 'pear', 'apple', 'rectangle', 'inverted-triangle']
  },
  skinColour: {
    type: String,
    enum: ['#F5D0B9', '#E6BC9A', '#D2A079', '#BA8665', '#9A5C4A', '#6B3D30'],
    default: '#D2A079'
  },
   phone:{
    type:Number,
  },
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = mongoose.model('User', userSchema);
