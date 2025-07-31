const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  poem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poem',
    required: true
  },
  viewerName: {
    type: String,
    required: true,
    trim: true
  },
  liked: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  ipAddress: String,
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

feedbackSchema.index({ poem: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);