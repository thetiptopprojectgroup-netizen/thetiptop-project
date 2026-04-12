import express from 'express';
import { body } from 'express-validator';
import { getRecentReviews, getMyReviewStatus, createReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';

const router = express.Router();

router.get('/recent', getRecentReviews);

router.get('/mine', protect, getMyReviewStatus);

const createValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('L\'avis doit contenir entre 10 et 500 caractères'),
  body('pseudo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 32 })
    .withMessage('Pseudo trop long'),
];

router.post('/', protect, validate(createValidation), createReview);

export default router;
