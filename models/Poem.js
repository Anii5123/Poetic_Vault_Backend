const mongoose = require('mongoose');

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: function() { return !this.pdfUrl; }
  },
  pdfUrl: {
    type: String,
    required: function() { return !this.content; }
  },
  passcode: {
    type: String,
    required: true,
    minlength: 4
  },
  author: {
    type: String,
    default: 'Anonymous'
  },
  category: {
    type: String,
    enum: ['love', 'friendship', 'motivation', 'nature', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  accessLog: [{
    viewerName: String,
    viewedAt: { type: Date, default: Date.now },
    ipAddress: String
  }]
}, {
  timestamps: true
});

poemSchema.index({ passcode: 1 });
poemSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Poem', poemSchema);