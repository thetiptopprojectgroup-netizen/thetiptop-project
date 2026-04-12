import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // === MCD: UTILISATEUR fields ===
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    mot_de_passe_hash: {
      type: String,
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    date_naissance: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true;
          const age = Math.floor((Date.now() - v.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 18;
        },
        message: 'Vous devez avoir au moins 18 ans',
      },
    },
    sexe: {
      type: String,
      enum: ['homme', 'femme', 'autre', 'non_precise'],
    },
    telephone: {
      type: String,
      trim: true,
    },
    adresse: {
      type: String,
    },
    code_postal: {
      type: String,
    },
    ville: {
      type: String,
    },
    pays: {
      type: String,
      default: 'France',
    },
    date_inscription: {
      type: Date,
      default: Date.now,
    },
    date_derniere_connexion: {
      type: Date,
    },
    date_consentement: {
      type: Date,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    type_authentification: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    consentement_marketing: {
      type: Boolean,
      default: false,
    },
    consentement_cookies: {
      type: Boolean,
      default: false,
    },

    // === Implementation fields ===
    role: {
      type: String,
      enum: ['user', 'employee', 'admin'],
      default: 'user',
    },
    googleId: String,
    facebookId: String,
    avatar: String,
    /** Pseudo affiché sur les avis jeu (optionnel ; saisi à la 1re publication d’avis sinon) */
    pseudo: {
      type: String,
      trim: true,
      maxlength: [32, 'Le pseudo ne peut pas dépasser 32 caractères'],
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// === Virtuals (backward compat) ===
userSchema.virtual('nom_complet').get(function () {
  return `${this.prenom} ${this.nom}`;
});
userSchema.virtual('firstName').get(function () { return this.prenom; });
userSchema.virtual('lastName').get(function () { return this.nom; });
userSchema.virtual('fullName').get(function () { return this.nom_complet; });
userSchema.virtual('isActive').get(function () { return this.actif; });
userSchema.virtual('marketingConsent').get(function () { return this.consentement_marketing; });

userSchema.virtual('participations', {
  ref: 'Participation',
  localField: '_id',
  foreignField: 'user',
});

// === Index ===
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ actif: 1 });

// === Middleware ===
userSchema.pre('save', async function (next) {
  if (!this.isModified('mot_de_passe_hash')) return next();
  if (this.mot_de_passe_hash) {
    const salt = await bcrypt.genSalt(12);
    this.mot_de_passe_hash = await bcrypt.hash(this.mot_de_passe_hash, salt);
  }
  next();
});

// === Methods ===
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.mot_de_passe_hash) return false;
  return bcrypt.compare(candidatePassword, this.mot_de_passe_hash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.prenom,
    lastName: this.nom,
    fullName: this.nom_complet,
    nom: this.nom,
    prenom: this.prenom,
    sexe: this.sexe,
    telephone: this.telephone,
    adresse: this.adresse,
    code_postal: this.code_postal,
    ville: this.ville,
    pays: this.pays,
    date_naissance: this.date_naissance,
    avatar: this.avatar,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    type_authentification: this.type_authentification,
    consentement_marketing: this.consentement_marketing,
    consentement_cookies: this.consentement_cookies,
    date_inscription: this.date_inscription,
    createdAt: this.createdAt,
    pseudo: this.pseudo || '',
  };
};

const User = mongoose.model('User', userSchema);

export default User;
