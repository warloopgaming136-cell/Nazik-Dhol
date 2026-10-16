const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['Basic Package', 'Standard Package', 'Premium Package', 'Royal Package', 'VIP Package'],
    },
    price: { type: Number, required: true },
    features: [{ type: String }],
    numberOfMembers: { type: Number, required: true },
    duration: { type: String, required: true },
    instrumentsIncluded: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', PackageSchema);
