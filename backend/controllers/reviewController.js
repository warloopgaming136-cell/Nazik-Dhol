const Review = require('../models/Review');

// @desc    Get approved reviews (public) or all reviews (admin)
// @route   GET /api/reviews
// @access  Public / Private(Admin sees all via ?all=true)
exports.getReviews = async (req, res, next) => {
  try {
    const showAll = req.user && req.user.role === 'admin' && req.query.all === 'true';
    const query = showAll ? {} : { isApproved: true };
    const reviews = await Review.find(query).sort('-createdAt');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a review (public, goes to pending approval)
// @route   POST /api/reviews
// @access  Public
exports.createReview = async (req, res, next) => {
  try {
    const { customerName, rating, comment, eventType, photo } = req.body;
    if (!customerName || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Name, rating and comment are required.' });
    }
    const review = await Review.create({
      user: req.user ? req.user.id : undefined,
      customerName,
      rating,
      comment,
      eventType,
      photo,
    });
    res.status(201).json({ success: true, message: 'Thank you! Your review will appear after admin approval.', data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve / reject a review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved !== undefined ? req.body.isApproved : true },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    next(error);
  }
};
