import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware pour vérifier le token JWT
export const protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier le header Authorization
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Vérifier les cookies (pour les sessions OAuth)
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Veuillez vous connecter.',
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.',
      });
    }

    if (!user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Votre compte a été désactivé.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré. Veuillez vous reconnecter.',
      });
    }
    next(error);
  }
};

// Middleware optionnel - ajoute l'utilisateur si connecté, sinon continue
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.actif) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};

// Middleware pour restreindre l'accès par rôle
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour effectuer cette action.',
      });
    }
    next();
  };
};

// Middleware pour les employés et admins
export const employeeOrAdmin = (req, res, next) => {
  if (!['employee', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux employés et administrateurs.',
    });
  }
  next();
};

// Middleware admin uniquement
export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs.',
    });
  }
  next();
};
