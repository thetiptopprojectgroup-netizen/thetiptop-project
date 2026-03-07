import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../middlewares/errorHandler.js';
import crypto from 'crypto';

// @desc    Inscription
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const {
      email, password, firstName, lastName, dateOfBirth,
      gender, phone, acceptedTerms, marketingConsent, cookieConsent,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('Un compte existe déjà avec cet email. Connectez-vous ou utilisez « Mot de passe oublié » si vous ne vous en souvenez plus.', 400));
    }

    const user = await User.create({
      email,
      mot_de_passe_hash: password,
      prenom: firstName,
      nom: lastName,
      date_naissance: dateOfBirth,
      sexe: gender === 'male' ? 'homme' : gender === 'female' ? 'femme' : gender === 'other' ? 'autre' : 'non_precise',
      telephone: phone,
      date_consentement: acceptedTerms ? new Date() : undefined,
      consentement_marketing: marketingConsent || false,
      consentement_cookies: cookieConsent || false,
      type_authentification: 'local',
    });

    const token = generateToken(user._id);

    user.date_derniere_connexion = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: { user: user.toPublicJSON(), token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Veuillez fournir un email et un mot de passe', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+mot_de_passe_hash');

    if (!user) {
      return next(new AppError('Aucun compte n\'est associé à cet email.', 401));
    }

    if (!user.mot_de_passe_hash) {
      return next(new AppError(
        'Ce compte a été créé via Google ou Facebook. Veuillez utiliser la connexion correspondante.',
        400
      ));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Mot de passe incorrect.', 401));
    }

    if (!user.actif) {
      return next(new AppError('Votre compte a été désactivé. Contactez l\'administrateur.', 401));
    }

    const token = generateToken(user._id);

    user.date_derniere_connexion = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: { user: user.toPublicJSON(), token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Profil
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mise à jour profil
// @route   PUT /api/auth/me
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'prenom', 'nom', 'telephone', 'date_naissance', 'sexe',
      'adresse', 'code_postal', 'ville', 'pays',
      'consentement_marketing', 'consentement_cookies',
      // backward compat
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address',
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Map old field names to new
        if (field === 'firstName') updates.prenom = req.body[field];
        else if (field === 'lastName') updates.nom = req.body[field];
        else if (field === 'phone') updates.telephone = req.body[field];
        else if (field === 'dateOfBirth') updates.date_naissance = req.body[field];
        else if (field === 'gender') {
          const gMap = { male: 'homme', female: 'femme', other: 'autre', prefer_not_to_say: 'non_precise' };
          updates.sexe = gMap[req.body[field]] || req.body[field];
        }
        else if (field === 'address') {
          if (typeof req.body[field] === 'object') {
            updates.adresse = req.body[field].street;
            updates.ville = req.body[field].city;
            updates.code_postal = req.body[field].postalCode;
            updates.pays = req.body[field].country;
          }
        }
        else updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour',
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Changer mot de passe
// @route   PUT /api/auth/password
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+mot_de_passe_hash');

    if (user.mot_de_passe_hash) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return next(new AppError('Mot de passe actuel incorrect', 400));
      }
    }

    user.mot_de_passe_hash = newPassword;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mot de passe oublié
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    res.status(200).json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token invalide ou expiré', 400));
    }

    user.mot_de_passe_hash = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: { token: authToken },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth callback
export const oauthCallback = async (req, res) => {
  const baseUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
  try {
    if (!req.user) {
      return res.redirect(`${baseUrl}/login?error=oauth_failed`);
    }
    const token = generateToken(req.user._id);
    req.user.date_derniere_connexion = new Date();
    await req.user.save({ validateBeforeSave: false });
    res.redirect(`${baseUrl}/oauth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${baseUrl}/login?error=oauth_error`);
  }
};

// @desc    Déconnexion
// @route   POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer son compte (client)
// @route   DELETE /api/auth/me
export const deleteMyAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404));
    }
    user.actif = false;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Votre compte a été supprimé.',
    });
  } catch (error) {
    next(error);
  }
};
