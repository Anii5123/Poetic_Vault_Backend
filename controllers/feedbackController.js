const Feedback = require('../models/Feedback');
const Poem = require('../models/Poem');
const emailService = require('../utils/emailService');
const { validationResult } = require('express-validator');

exports.submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { poemId, viewerName, liked, message, rating } = req.body;

    // Verify poem exists
    const poem = await Poem.findById(poemId).populate('createdBy');
    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    const feedback = await Feedback.create({
      poem: poemId,
      viewerName,
      liked,
      message,
      rating,
      ipAddress: req.ip
    });

    // Send email notification to admin
    try {
      await emailService.sendFeedbackNotification(
        poem.createdBy.email,
        {
          poemTitle: poem.title,
          viewerName,
          liked,
          message,
          rating
        }
      );
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const poemId = req.query.poemId;

    let query = {};
    if (poemId) {
      // Verify the poem belongs to the admin
      const poem = await Poem.findOne({ _id: poemId, createdBy: req.admin.id });
      if (!poem) {
        return res.status(404).json({ message: 'Poem not found' });
      }
      query.poem = poemId;
    } else {
      // Get all poems by this admin
      const adminPoems = await Poem.find({ createdBy: req.admin.id }).select('_id');
      query.poem = { $in: adminPoems.map(p => p._id) };
    }

    const feedback = await Feedback.find(query)
      .populate('poem', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
};

exports.markFeedbackAsRead = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId).populate('poem');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Verify the poem belongs to the admin
    const poem = await Poem.findOne({ _id: feedback.poem._id, createdBy: req.admin.id });
    if (!poem) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    feedback.isRead = true;
    await feedback.save();

    res.json({
      message: 'Feedback marked as read',
      feedback
    });
  } catch (error) {
    console.error('Mark feedback as read error:', error);
    res.status(500).json({ message: 'Server error updating feedback' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId).populate('poem');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Verify the poem belongs to the admin
    const poem = await Poem.findOne({ _id: feedback.poem._id, createdBy: req.admin.id });
    if (!poem) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    const adminPoems = await Poem.find({ createdBy: req.admin.id }).select('_id');
    const poemIds = adminPoems.map(p => p._id);

    const totalFeedback = await Feedback.countDocuments({ poem: { $in: poemIds } });
    const positiveFeedback = await Feedback.countDocuments({ 
      poem: { $in: poemIds }, 
      liked: true 
    });
    const unreadFeedback = await Feedback.countDocuments({ 
      poem: { $in: poemIds }, 
      isRead: false 
    });

    const averageRating = await Feedback.aggregate([
      { $match: { poem: { $in: poemIds }, rating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const recentFeedback = await Feedback.find({ poem: { $in: poemIds } })
      .populate('poem', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalFeedback,
        positiveFeedback,
        negativeFeedback: totalFeedback - positiveFeedback,
        unreadFeedback,
        averageRating: averageRating[0]?.avgRating || 0,
        recentFeedback
      }
    });
  } catch (error) {
    console.error('Feedback stats error:', error);
    res.status(500).json({ message: 'Server error fetching feedback stats' });
  }
};