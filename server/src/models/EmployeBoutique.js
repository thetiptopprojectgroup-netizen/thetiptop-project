<<<<<<< HEAD
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeBoutiqueSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mot_de_passe_hash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['employee', 'manager'],
      default: 'employee',
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    date_creation: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

employeBoutiqueSchema.index({ email: 1 }, { unique: true });
employeBoutiqueSchema.index({ boutique: 1 });

employeBoutiqueSchema.pre('save', async function (next) {
  if (!this.isModified('mot_de_passe_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.mot_de_passe_hash = await bcrypt.hash(this.mot_de_passe_hash, salt);
  next();
});

employeBoutiqueSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.mot_de_passe_hash);
};

employeBoutiqueSchema.virtual('nom_complet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

employeBoutiqueSchema.set('toJSON', { virtuals: true });
employeBoutiqueSchema.set('toObject', { virtuals: true });

const EmployeBoutique = mongoose.model('EmployeBoutique', employeBoutiqueSchema);

export default EmployeBoutique;
=======
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeBoutiqueSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mot_de_passe_hash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['employee', 'manager'],
      default: 'employee',
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
      required: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    date_creation: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

employeBoutiqueSchema.index({ boutique: 1 });

employeBoutiqueSchema.pre('save', async function (next) {
  if (!this.isModified('mot_de_passe_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.mot_de_passe_hash = await bcrypt.hash(this.mot_de_passe_hash, salt);
  next();
});

employeBoutiqueSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.mot_de_passe_hash);
};

employeBoutiqueSchema.virtual('nom_complet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

employeBoutiqueSchema.set('toJSON', { virtuals: true });
employeBoutiqueSchema.set('toObject', { virtuals: true });

const EmployeBoutique = mongoose.model('EmployeBoutique', employeBoutiqueSchema);

export default EmployeBoutique;
>>>>>>> origin/vpreprod
