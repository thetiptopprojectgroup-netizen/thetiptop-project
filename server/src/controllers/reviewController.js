import GameReview from '../models/GameReview.js';
import Participation from '../models/Participation.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

const PSEUDO_RE = /^[\p{L}\p{N}_\- ]{2,32}$/u;

function normalizePseudo(raw) {
  if (raw == null) return '';
  return String(raw).trim().slice(0, 32);
}

/** @route GET /api/reviews/recent */
export const getRecentReviews = async (req, res, next) => {
  try {
    const reviews = await GameReview.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rating comment pseudoAffiche createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/reviews/mine */
export const getMyReviewStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [hasParticipation, review, user] = await Promise.all([
      Participation.exists({ user: userId }),
      GameReview.findOne({ user: userId })
        .select('rating comment pseudoAffiche createdAt')
        .lean(),
      User.findById(userId).select('pseudo'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        hasParticipated: !!hasParticipation,
        hasReview: !!review,
        pseudo: user?.pseudo ? String(user.pseudo).trim() : '',
        review,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/reviews */
export const createReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const hasParticipation = await Participation.exists({ user: userId });
    if (!hasParticipation) {
      return next(
        new AppError("Vous devez avoir joué au moins une fois avant de laisser un avis.", 403)
      );
    }

    const existing = await GameReview.findOne({ user: userId });
    if (existing) {
      return next(new AppError('Vous avez déjà publié un avis.', 400));
    }

    const rating = Number(req.body.rating);
    const comment = req.body.comment != null ? String(req.body.comment).trim() : '';
    let pseudoInput = req.body.pseudo != null ? normalizePseudo(req.body.pseudo) : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return next(new AppError('La note doit être un entier entre 1 et 5.', 400));
    }
    if (comment.length < 10) {
      return next(new AppError('Votre avis doit contenir au moins 10 caractères.', 400));
    }
    if (comment.length > 500) {
      return next(new AppError('Votre avis ne peut pas dépasser 500 caractères.', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Utilisateur introuvable.', 404));
    }

    let displayPseudo = user.pseudo && String(user.pseudo).trim() ? String(user.pseudo).trim() : '';

    if (!displayPseudo) {
      if (!pseudoInput) {
        return next(new AppError('Indiquez un pseudo pour afficher votre avis.', 400));
      }
      if (!PSEUDO_RE.test(pseudoInput)) {
        return next(
          new AppError(
            'Pseudo invalide (2 à 32 caractères : lettres, chiffres, espaces, tiret ou underscore).',
            400
          )
        );
      }
      user.pseudo = pseudoInput;
      displayPseudo = pseudoInput;
      await user.save({ validateBeforeSave: true });
    }

    const review = await GameReview.create({
      user: userId,
      rating,
      comment,
      pseudoAffiche: displayPseudo,
    });

    res.status(201).json({
      success: true,
      message: 'Merci pour votre avis !',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          pseudoAffiche: review.pseudoAffiche,
          createdAt: review.createdAt,
        },
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};
