const User = require('../models/user.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utility/error');
const Product = require('../models/product.model');
const ApiResponse = require('../utility/resonse.js');
const FashionQuiz = require('../models/fashion.models');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// Set cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    // sameSite: 'Strict',
    maxAge: 60 * 60 * 1000*27, // 1 day
  });
};

exports.signup = async (req, res) => {
  const { name, email, password, bodyShape, skinColour } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json(ApiError('User already exists', 400));

    const user = new User({ name, email, password, bodyShape, skinColour });
    await user.save();

    const token = user.generateAuthToken();
    setTokenCookie(res, token);

    return res.status(201).json(
      ApiResponse(201, 'Signup successful', {
        name: user.name,
        email: user.email,
      })
    );
  } catch (error) {
    return res.status(500).json(ApiError(error.message, 500));
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json(ApiError('Invalid email or password', 400));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json(ApiError('Invalid email or password', 400));

    const token = user.generateAuthToken();
    setTokenCookie(res, token);

    return res.status(200).json(
      ApiResponse(200, 'Login successful', {
        name: user.name,
        email: user.email,
      })
    );
  } catch (error) {
    return res.status(500).json(ApiError(error.message, 500));
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json(ApiResponse(200, 'Logout successful', null));
};

exports.getCurrentUser = (req, res) => {
  return res.status(200).json(
    ApiResponse(200, 'User fetched', {
      name: req.user.name,
      email: req.user.email,
      bodyShape: req.user.bodyShape,
      skinColour: req.user.skinColour,
    })
  );
};


// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar, bodyShape, skinColour, phone } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar;
    user.bodyShape = bodyShape || user.bodyShape;
    user.skinColour = skinColour || user.skinColour;
    user.phone = phone || user.phone;

    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bodyShape: user.bodyShape,
      skinColour: user.skinColour,
      phone: user.phone
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { price, image, description, brand, link, title } = req.body;

    // Check if product already exists in DB (by unique identifier like link)
    let product = await Product.findOne({ link });

    // If not, create and save new product
    if (!product) {
      product = new Product({ price, image, description, brand, link, title });
      await product.save();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const productId = product._id;

    // Check if product already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.json({ message: 'Product added to wishlist', wishlist: user.wishlist, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', success: false });
  }
};


// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    // console.log(productId)
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      wishlistCount: user.wishlist.length,
      // Add more stats as needed
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




// Configure email transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code to email
exports.sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address' 
      });
    }

    // Generate and save verification code
    const verificationCode = generateVerificationCode();
    user.resetPasswordToken = verificationCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send email with verification code
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Verification Code',
      text: `Your password reset verification code is: ${verificationCode}\n\n` +
        `This code will expire in 1 hour.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: `Verification code sent to ${email}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending verification code' 
    });
  }
};

// Verify the reset code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Find user by email and check code
    const user = await User.findOne({ 
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
      });
    }

    // If code is valid, generate a temporary token for password reset
    const tempToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = tempToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Code verified successfully',
      tempToken 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying code' 
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, tempToken, newPassword, confirmPassword } = req.body;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      });
    }

    // Find user with valid token
    const user = await User.findOne({ 
      email,
      resetPasswordToken: tempToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // Update password (will automatically hash via pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // This will trigger your existing pre-save hook
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error resetting password' 
    });
  }
};
