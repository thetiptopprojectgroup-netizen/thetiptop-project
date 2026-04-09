import dotenv from 'dotenv';

import connectDB from './config/database.js';
import app from './app.js';

// Configuration des variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

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
