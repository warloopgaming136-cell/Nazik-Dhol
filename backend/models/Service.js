const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    startingPrice: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g. "2 - 3 hours"
    icon: { type: String, default: 'fa-drum' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', ServiceSchema);
