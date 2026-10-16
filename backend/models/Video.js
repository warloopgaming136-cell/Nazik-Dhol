const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    youtubeId: { type: String, required: true }, // e.g. dQw4w9WgXcQ
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'Performance Highlights' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', VideoSchema);
