import mongoose from 'mongoose';

const huissierSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    titre: {
      type: String,
      default: 'Maître',
    },
    cabinet: {
      type: String,
    },
    adresse: {
      type: String,
    },
    telephone: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    numero_huissier: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

huissierSchema.virtual('nom_complet').get(function () {
  return `${this.titre} ${this.prenom} ${this.nom}`;
});

huissierSchema.set('toJSON', { virtuals: true });
huissierSchema.set('toObject', { virtuals: true });

const Huissier = mongoose.model('Huissier', huissierSchema);

export default Huissier;
