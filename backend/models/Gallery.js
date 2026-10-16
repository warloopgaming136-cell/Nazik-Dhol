const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Wedding', 'Temple', 'Festival', 'Reception', 'Corporate'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', GallerySchema);
