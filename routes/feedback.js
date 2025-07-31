const express = require('express');
const { body } = require('express-validator');
const {
  submitFeedback,
  getFeedback,
  markFeedbackAsRead,
  deleteFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const feedbackValidation = [
  body('poemId')
    .isMongoId()
    .withMessage('Invalid poem ID'),
  body('viewerName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Viewer name must be between 1 and 100 characters'),
  body('liked')
    .isBoolean()
    .withMessage('Liked must be a boolean value'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Public routes
router.post('/', feedbackValidation, submitFeedback);

// Protected routes
router.use(protect);
router.get('/', getFeedback);
router.get('/stats', getFeedbackStats);
router.patch('/:id/read', markFeedbackAsRead);
router.delete('/:id', deleteFeedback);

module.exports = router;