import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema(
  {
    // === MCD: PARTICIPATION fields ===
    date_participation: {
      type: Date,
      default: Date.now,
    },
    ip_adresse: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    gagnant: {
      type: Boolean,
      default: true, // 100% gagnant
    },
    date_verification: {
      type: Date,
    },
    eligible_tirage_final: {
      type: Boolean,
      default: true,
    },

    // === Relations ===
    // MCD: fait (UTILISATEUR -> PARTICIPATION)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // MCD: utilise (CODE -> PARTICIPATION via gagne)
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Code',
      required: true,
    },
    // Denormalized prize info
    prize: {
      id: String,
      name: String,
      description: String,
      value: Number,
      image: String,
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'claimed', 'expired'],
      default: 'won',
    },
    claimedAt: Date,
    claimedMethod: {
      type: String,
      enum: ['store', 'online'],
    },
    claimedInStore: String,
  },
  {
    timestamps: true,
  }
);

// Index composé pour éviter les doublons
participationSchema.index({ user: 1, ticket: 1 }, { unique: true });
participationSchema.index({ user: 1 });
participationSchema.index({ ticket: 1 });
participationSchema.index({ status: 1 });
participationSchema.index({ createdAt: 1 });
participationSchema.index({ eligible_tirage_final: 1 });

// Auto-populate ticket
participationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'ticket',
    select: 'code prize etat',
  });
  next();
});

const Participation = mongoose.model('Participation', participationSchema);

export default Participation;
