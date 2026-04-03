import mongoose from 'mongoose';

const lotSchema = new mongoose.Schema(
  {
    libelle: {
      type: String,
      required: true,
    },
    type_lot: {
      type: String,
      required: true,
      enum: ['infuseur', 'the_detox', 'the_signature', 'coffret_39', 'coffret_69'],
    },
    pourcentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    valeur_euro: {
      type: Number,
      required: true,
    },
    stock_initial: {
      type: Number,
      required: true,
    },
    stock_restant: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    image_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

lotSchema.index({ type_lot: 1 }, { unique: true });

// Définitions des lots par défaut
export const LOT_DEFINITIONS = [
  {
    libelle: 'Infuseur à thé',
    type_lot: 'infuseur',
    pourcentage: 60,
    valeur_euro: 10,
    stock_initial: 300000,
    stock_restant: 300000,
    description: 'Un infuseur à thé élégant en acier inoxydable',
    image_url: '/images/prizes/infuseur.jpg',
  },
  {
    libelle: 'Thé détox ou infusion 100g',
    type_lot: 'the_detox',
    pourcentage: 20,
    valeur_euro: 15,
    stock_initial: 100000,
    stock_restant: 100000,
    description: 'Une boîte de 100g de thé détox ou d\'infusion bio',
    image_url: '/images/prizes/the-detox.jpg',
  },
  {
    libelle: 'Thé signature 100g',
    type_lot: 'the_signature',
    pourcentage: 10,
    valeur_euro: 25,
    stock_initial: 50000,
    stock_restant: 50000,
    description: 'Une boîte de 100g de notre thé signature exclusif',
    image_url: '/images/prizes/the-signature.jpg',
  },
  {
    libelle: 'Coffret découverte 39€',
    type_lot: 'coffret_39',
    pourcentage: 6,
    valeur_euro: 39,
    stock_initial: 30000,
    stock_restant: 30000,
    description: 'Un coffret découverte d\'une valeur de 39€',
    image_url: '/images/prizes/coffret-39.jpg',
  },
  {
    libelle: 'Coffret découverte 69€',
    type_lot: 'coffret_69',
    pourcentage: 4,
    valeur_euro: 69,
    stock_initial: 20000,
    stock_restant: 20000,
    description: 'Un coffret découverte premium d\'une valeur de 69€',
    image_url: '/images/prizes/coffret-69.jpg',
  },
];

const Lot = mongoose.model('Lot', lotSchema);

export default Lot;
