const mongoose = require('mongoose');

// Sub-schema for access log
const accessLogSchema = new mongoose.Schema({
  viewerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  }
}, { _id: false });

// Main Poem schema
const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: function () { return !this.pdfUrl; },
    maxlength: 10000
  },
  pdfUrl: {
    type: String,
    required: function () { return !this.content; }
  },
  passcode: {
    type: String,
    required: true,
    minlength: 4
  },
  author: {
    type: String,
    default: 'Anonymous',
    trim: true
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
  accessLog: [accessLogSchema]
}, {
  timestamps: true
});

// Indexes
poemSchema.index({ passcode: 1 });
poemSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Poem', poemSchema);
