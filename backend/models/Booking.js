const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional, guest bookings allowed
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        'Wedding', 'Reception', 'Birthday', 'Temple Festival', 'House Warming',
        'College Function', 'Corporate Event', 'Political Event', 'School Event',
        'Opening Ceremony', 'DJ Night', 'Special Festival', 'Other',
      ],
    },
    eventDate: { type: Date, required: true },
    eventTime: { type: String, required: true },
    venue: { type: String, required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    packageName: { type: String },
    specialRequirements: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    statusNote: { type: String, trim: true, default: '' },
    amount: { type: Number, default: 0 },
    bookingCode: { type: String, unique: true },
    notification: {
      email: {
        status: {
          type: String,
          enum: ['sent', 'failed', 'skipped'],
        },
        sentAt: { type: Date },
        error: { type: String, default: null },
      },
    },
  },
  { timestamps: true }
);

// Generate a human-friendly booking code, e.g. ND-7F3K9A
BookingSchema.pre('validate', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = 'ND-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
