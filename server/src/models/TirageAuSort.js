import mongoose from 'mongoose';

const tirageAuSortSchema = new mongoose.Schema(
  {
    date_tirage: {
      type: Date,
      required: true,
    },
    statut: {
      type: String,
      enum: ['programme', 'en_cours', 'termine', 'annule'],
      default: 'programme',
    },
    nombre_participant: {
      type: Number,
      default: 0,
    },
    gagnant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    huissier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Huissier',
    },
    administrateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lot_gros_lot: {
      nom: { type: String, default: 'Un an de thé' },
      description: { type: String, default: "Un an de thé d'une valeur de 360€" },
      valeur: { type: Number, default: 360 },
    },
    code_verification: {
      type: String,
      unique: true,
      sparse: true,
    },
    est_reclame: {
      type: Boolean,
      default: false,
    },
    date_reclamation: Date,
    notification_envoyee: {
      type: Boolean,
      default: false,
    },
    date_notification: Date,
  },
  {
    timestamps: true,
  }
);

tirageAuSortSchema.index({ date_tirage: 1 });
tirageAuSortSchema.index({ gagnant: 1 });

tirageAuSortSchema.pre('save', function (next) {
  if (!this.code_verification) {
    this.code_verification = `TAS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

const TirageAuSort = mongoose.model('TirageAuSort', tirageAuSortSchema);

export default TirageAuSort;
