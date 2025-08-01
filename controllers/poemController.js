const Poem = require('../models/Poem');
const Feedback = require('../models/Feedback');
const cloudinary = require('../config/cloudinary');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

exports.createPoem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, passcode, author, category } = req.body;
    let pdfUrl = null;

    // Handle PDF upload if present
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'poetic-vault/pdfs'
      });
      pdfUrl = result.secure_url;
    }

    const poem = await Poem.create({
      title,
      content: content || null,
      pdfUrl,
      passcode,
      author: author || 'Anonymous',
      category: category || 'other',
      createdBy: req.admin.id
    });

    // Generate QR Code
    const poemUrl = `${process.env.FRONTEND_URL}/unlock/${poem._id}`;
    const qrCode = await QRCode.toDataURL(poemUrl);

    res.status(201).json({
      message: 'Poem created successfully',
      poem,
      qrCode,
      shareUrl: poemUrl
    });
  } catch (error) {
    console.error('Create poem error:', error);
    res.status(500).json({ message: 'Server error creating poem' });
  }
};

exports.getPoems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const poems = await Poem.find({ createdBy: req.admin.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Poem.countDocuments({ createdBy: req.admin.id });

    res.json({
      poems,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get poems error:', error);
    res.status(500).json({ message: 'Server error fetching poems' });
  }
};

exports.getPoem = async (req, res) => {
  try {
    const poem = await Poem.findOne({
      _id: req.params.id,
      createdBy: req.admin.id
    }).populate('createdBy', 'username');

    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    res.json({ poem });
  } catch (error) {
    console.error('Get poem error:', error);
    res.status(500).json({ message: 'Server error fetching poem' });
  }
};

exports.updatePoem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, passcode, author, category, isActive } = req.body;
    let updateData = {
      title,
      content,
      passcode,
      author,
      category,
      isActive
    };

    // Handle PDF upload if present
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'poetic-vault/pdfs'
      });
      updateData.pdfUrl = result.secure_url;
    }

    const poem = await Poem.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.admin.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    res.json({
      message: 'Poem updated successfully',
      poem
    });
  } catch (error) {
    console.error('Update poem error:', error);
    res.status(500).json({ message: 'Server error updating poem' });
  }
};

exports.deletePoem = async (req, res) => {
  try {
    const poem = await Poem.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.admin.id
    });

    if (!poem) {
      return res.status(404).json({ message: 'Poem not found' });
    }

    // Delete associated feedback
    await Feedback.deleteMany({ poem: poem._id });

    res.json({ message: 'Poem deleted successfully' });
  } catch (error) {
    console.error('Delete poem error:', error);
    res.status(500).json({ message: 'Server error deleting poem' });
  }
};

// exports.unlockPoem = async (req, res) => {
//   try {
//     const { passcode, viewerName } = req.body;
//     // const poemId = req.params.id;

//     const poem = await Poem.findOne({ passcode: passcode, isActive: true });

//     if (!poem) {
//       return res.status(404).json({ message: 'Poem not found' });
//     }

//     if (poem.passcode !== passcode) {
//       return res.status(401).json({ message: 'Invalid passcode' });
//     }

//     // Log the access
//     poem.viewCount += 1;
//     poem.accessLog.push({
//       viewerName,
//       viewedAt: new Date(),
//       ipAddress: req.ip
//     });

//     await poem.save();

//     res.json({
//       message: 'Poem unlocked successfully',
//       poem: {
//         _id: poem._id,
//         title: poem.title,
//         content: poem.content,
//         pdfUrl: poem.pdfUrl,
//         author: poem.author,
//         category: poem.category
//       }
//     })
    
    
//     ;
//   } catch (error) {
//     console.error('Unlock poem error:', error);
//     res.status(500).json({ message: 'Server error unlocking poem' });
//   }
// };

exports.unlockPoem = async (req, res) => {
  try {
    const { passcode, viewerName } = req.body;

    const poem = await Poem.findOne({ passcode: passcode, isActive: true });

    if (!poem) {
      return res.status(404).json({ message: 'Poem not found or inactive' });
    }

    // Log the access
    poem.viewCount += 1;
    poem.accessLog.push({
      viewerName,
      viewedAt: new Date(),
      ipAddress: req.ip
    });

    await poem.save();

    return res.status(200).json({
      message: 'Poem unlocked successfully',
      poem: {
        _id: poem._id,
        title: poem.title,
        content: poem.content,
        pdfUrl: poem.pdfUrl,
        author: poem.author,
        category: poem.category
      }
    });
  } catch (error) {
    console.error('Unlock poem error:', error);
    return res.status(500).json({ message: 'Server error unlocking poem' });
  }
};

exports.getPoemAnalytics = async (req, res) => {
  try {
    const poems = await Poem.find({ createdBy: req.admin.id });
    const totalViews = poems.reduce((sum, poem) => sum + poem.viewCount, 0);
    const totalPoems = poems.length;
    
    const feedbackCount = await Feedback.countDocuments({
      poem: { $in: poems.map(p => p._id) }
    });

    const categoryStats = await Poem.aggregate([
      { $match: { createdBy: req.admin.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const recentActivity = await Poem.find({ createdBy: req.admin.id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title viewCount updatedAt');

    res.json({
      analytics: {
        totalPoems,
        totalViews,
        feedbackCount,
        categoryStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};