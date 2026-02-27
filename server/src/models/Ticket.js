import mongoose from 'mongoose';

// === MCD: TICKET entity ===
const ticketSchema = new mongoose.Schema(
  {
    numero_ticket: {
      type: String,
      required: true,
      unique: true,
    },
    montant: {
      type: Number,
      required: true,
      min: [49, "Le montant minimum d'achat est de 49€"],
    },
    date_achat: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['boutique', 'en_ligne'],
      default: 'boutique',
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
    },
    // Relation with CODE
    code: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Code',
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ boutique: 1 });
ticketSchema.index({ date_achat: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

// === MCD: CODE entity ===
const codeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{10}$/, 'Le code doit contenir exactement 10 caractères alphanumériques'],
    },
    date_generation: {
      type: Date,
      default: Date.now,
    },
    etat: {
      type: String,
      enum: ['disponible', 'utilise', 'reclame', 'expire'],
      default: 'disponible',
    },
    date_utilisation: {
      type: Date,
    },
    // Relation with LOT (MCD: associe)
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lot',
      required: true,
    },
    // Denormalized prize info for quick access
    prize: {
      id: String,
      name: String,
      description: String,
      value: Number,
      image: String,
    },
    // Relation with USER (MCD: utilise)
    utilise_par: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

codeSchema.index({ etat: 1 });
codeSchema.index({ utilise_par: 1 });
codeSchema.index({ lot: 1 });

// Static method for unique code generation
codeSchema.statics.generateUniqueCode = function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if code can be used (date de fin : défaut si pas de config en base ; la vraie validation utilise getContestDates() dans le controller)
codeSchema.methods.canBeUsed = function () {
  const now = new Date();
  const claimEndDefault = new Date('2026-04-29');
  return this.etat === 'disponible' && now <= claimEndDefault;
};

const Code = mongoose.model('Code', codeSchema);

// Export prize definitions for backward compatibility
export const PRIZES = {
  INFUSEUR: {
    id: 'infuseur',
    name: 'Infuseur à thé',
    description: 'Un infuseur à thé élégant en acier inoxydable',
    value: 10,
    percentage: 60,
    image: '/images/prizes/infuseur.jpg',
  },
  THE_DETOX: {
    id: 'the_detox',
    name: 'Thé détox ou infusion 100g',
    description: "Une boîte de 100g de thé détox ou d'infusion bio",
    value: 15,
    percentage: 20,
    image: '/images/prizes/the-detox.jpg',
  },
  THE_SIGNATURE: {
    id: 'the_signature',
    name: 'Thé signature 100g',
    description: 'Une boîte de 100g de notre thé signature exclusif',
    value: 25,
    percentage: 10,
    image: '/images/prizes/the-signature.jpg',
  },
  COFFRET_39: {
    id: 'coffret_39',
    name: 'Coffret découverte 39€',
    description: "Un coffret découverte d'une valeur de 39€",
    value: 39,
    percentage: 6,
    image: '/images/prizes/coffret-39.jpg',
  },
  COFFRET_69: {
    id: 'coffret_69',
    name: 'Coffret découverte 69€',
    description: "Un coffret découverte premium d'une valeur de 69€",
    value: 69,
    percentage: 4,
    image: '/images/prizes/coffret-69.jpg',
  },
};

// Static method for random prize
codeSchema.statics.getRandomPrize = function () {
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const key of Object.keys(PRIZES)) {
    cumulative += PRIZES[key].percentage;
    if (random <= cumulative) {
      return PRIZES[key];
    }
  }
  return PRIZES.COFFRET_69;
};

export { Ticket, Code };
export default Code;
