// Classe pour les erreurs personnalisées
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Gestion des erreurs MongoDB de duplication
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} "${value}" existe déjà. Veuillez utiliser une autre valeur.`;
  return new AppError(message, 400);
};

// Gestion des erreurs de validation MongoDB
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Données invalides: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Gestion des erreurs de cast MongoDB (ObjectId invalide)
const handleCastError = (err) => {
  const message = `Valeur invalide pour le champ ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Gestion des erreurs JWT
const handleJWTError = () => {
  return new AppError('Token invalide. Veuillez vous reconnecter.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Votre session a expiré. Veuillez vous reconnecter.', 401);
};

// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // En développement, on envoie toutes les infos
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // En production, on gère les erreurs de manière plus propre
  let error = { ...err };
  error.message = err.message;

  // Erreur de duplication (email déjà utilisé, etc.)
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // Erreur de cast (ID invalide)
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Erreurs opérationnelles (prévues)
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Erreurs de programmation ou inconnues
  console.error('❌ ERREUR:', err);
  
  return res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue',
  });
};

// Middleware pour les routes non trouvées
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} non trouvée`, 404);
  next(error);
};

export default errorHandler;
