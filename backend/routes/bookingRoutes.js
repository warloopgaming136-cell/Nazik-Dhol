const express = require('express');
const router = express.Router();
const {
  createBooking, getMyBookings, getBooking, cancelBooking,
  getAllBookings, updateBookingStatus, resendBookingEmail, getBookingStats,
} = require('../controllers/bookingController');

const { protect, optionalAuth, authorize } = require('../middleware/auth');

// Public can submit a booking without logging in (but if logged in, link user account)
router.post('/', optionalAuth, createBooking);

router.get('/stats/overview', protect, authorize('admin'), getBookingStats);
router.get('/my', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.post('/:id/resend-email', protect, authorize('admin'), resendBookingEmail);

module.exports = router;

