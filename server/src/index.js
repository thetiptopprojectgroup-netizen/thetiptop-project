import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';

import connectDB from './config/database.js';
import configurePassport from './config/passport.js';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler, { notFound } from './middlewares/errorHandler.js';

// Configuration des variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

// Initialisation de l'application Express
const app = express();

// Configuration de la sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Configuration CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting aux routes API
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 tentatives
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 1 heure.',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration de Passport
configurePassport();
app.use(passport.initialize());

// Routes API
app.use('/api', routes);

// Routes OAuth aussi sous /auth (si le proxy/ingress enlève le préfixe /api → évite 404)
app.use('/auth', authRoutes);

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🍵 Bienvenue sur l\'API Thé Tip Top',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Gestion des routes non trouvées
app.use(notFound);

// Gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🍵 ═══════════════════════════════════════════════════════════
   Thé Tip Top API Server
   ═══════════════════════════════════════════════════════════
   
   🚀 Serveur démarré sur le port ${PORT}
   🌍 Environnement: ${process.env.NODE_ENV || 'development'}
   📡 API: http://localhost:${PORT}/api
   💚 Santé: http://localhost:${PORT}/api/health
   
═══════════════════════════════════════════════════════════════
  `);
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu. Arrêt gracieux...');
  server.close(() => {
    console.log('✅ Serveur arrêté.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
