import mongoose from 'mongoose';

const remiseLotSchema = new mongoose.Schema(
  {
    participation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participation',
      required: true,
    },
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeBoutique',
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
    },
    date_remise: {
      type: Date,
      default: Date.now,
    },
    mode_remise: {
      type: String,
      enum: ['boutique', 'en_ligne', 'envoi_postal'],
      default: 'boutique',
    },
    statut: {
      type: String,
      enum: ['en_attente', 'remis', 'annule', 'expire'],
      default: 'en_attente',
    },
    commentaire: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

remiseLotSchema.index({ participation: 1 });
remiseLotSchema.index({ employe: 1 });
remiseLotSchema.index({ boutique: 1 });
remiseLotSchema.index({ statut: 1 });

const RemiseLot = mongoose.model('RemiseLot', remiseLotSchema);

export default RemiseLot;
