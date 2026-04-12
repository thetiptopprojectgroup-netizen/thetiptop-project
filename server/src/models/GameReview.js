import mongoose from 'mongoose';

const gameReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    /** Note 1 à 5 */
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'L\'avis ne peut pas dépasser 500 caractères'],
      minlength: [10, 'L\'avis doit contenir au moins 10 caractères'],
    },
    /** Pseudo affiché (figé au moment de la publication) */
    pseudoAffiche: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
  },
  { timestamps: true }
);

gameReviewSchema.index({ createdAt: -1 });

const GameReview = mongoose.model('GameReview', gameReviewSchema);

export default GameReview;
