const express = require('express');
const { body } = require('express-validator');
const {
  createPoem,
  getPoems,
  getPoem,
  updatePoem,
  deletePoem,
  unlockPoem,
  getPoemAnalytics
} = require('../controllers/poemController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation rules
const poemValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('passcode')
    .isLength({ min: 4 })
    .withMessage('Passcode must be at least 4 characters long'),
  body('category')
    .optional()
    .isIn(['love', 'friendship', 'motivation', 'nature', 'other'])
    .withMessage('Invalid category'),
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters')
];

const unlockValidation = [
  body('passcode')
    .notEmpty()
    .withMessage('Passcode is required'),
  body('viewerName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Viewer name must be between 1 and 100 characters')
];

// Public routes
router.post('/unlock/:id', unlockValidation, unlockPoem);

// Protected routes
router.use(protect);
router.post('/', upload.single('pdf'), poemValidation, createPoem);
router.get('/', getPoems);
router.get('/analytics', getPoemAnalytics);
router.get('/:id', getPoem);
router.put('/:id', upload.single('pdf'), poemValidation, updatePoem);
router.delete('/:id', deletePoem);

module.exports = router;