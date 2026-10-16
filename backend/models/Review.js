const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    photo: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    eventType: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', ReviewSchema);
