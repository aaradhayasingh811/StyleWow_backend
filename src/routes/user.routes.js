// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login, logout,getCurrentUser  } = require('../controllers/user.controllers');
const authMiddleware = require('../middlewares/auth.middleware');
const fashionQuizController = require('../controllers/fashionQuizController');
const productController = require('../controllers/productController');
const userController = require('../controllers/user.controllers');
const { getFashionRecommendations, validateFashionRequest } = require('../controllers/fashionQuizController');


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout',authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

// User routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/wishlist', authMiddleware, userController.getWishlist);
router.post('/wishlist', authMiddleware, userController.addToWishlist);
router.delete('/wishlist/:productId', authMiddleware, userController.removeFromWishlist);
router.get('/dashboard', authMiddleware, userController.getDashboardStats);

// Fashion quiz routes
router.post(
  '/recommendations',
  authMiddleware,
  validateFashionRequest,
  getFashionRecommendations
);

// Product routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);

// Reset password route
router.post('/send-reset-code', userController.sendResetCode);
router.post('/verify-reset-code', userController.verifyResetCode);
router.post('/reset-password', userController.resetPassword);

// get history
router.get('/get-history',authMiddleware,fashionQuizController.getHistory);

module.exports = router;
