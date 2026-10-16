const express = require('express');
const router = express.Router();
const { getReviews, createReview, approveReview, deleteReview } = require('../controllers/reviewController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getReviews);
router.post('/', createReview);
router.put('/:id/approve', protect, authorize('admin'), approveReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
