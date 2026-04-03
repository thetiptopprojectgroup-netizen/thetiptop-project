import mongoose from 'mongoose';

const boutiqueSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la boutique est requis'],
      trim: true,
    },
    adresse: {
      type: String,
      required: [true, "L'adresse est requise"],
    },
    code_postal: {
      type: String,
      required: true,
      match: [/^\d{5}$/, 'Code postal invalide'],
    },
    ville: {
      type: String,
      required: true,
    },
    telephone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    date_ouverture: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

boutiqueSchema.index({ ville: 1 });
boutiqueSchema.index({ actif: 1 });

const Boutique = mongoose.model('Boutique', boutiqueSchema);

export default Boutique;
