const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true }, // e.g. "Lead Dhol Player", "Captain"
    experience: { type: String, required: true }, // e.g. "8+ years"
    phone: { type: String, required: true },
    photo: { type: String, default: '' },
    bio: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);
