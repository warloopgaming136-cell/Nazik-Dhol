const mongoose = require('mongoose');

// Tracks calendar status per date: available / booked / holiday
const AvailableDateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    status: { type: String, enum: ['available', 'booked', 'holiday'], default: 'available' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AvailableDate', AvailableDateSchema);
