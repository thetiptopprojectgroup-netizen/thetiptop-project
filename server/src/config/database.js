import mongoose from 'mongoose';
import Participation from '../models/Participation.js';
import { setMongoConnectionState } from '../monitoring/metrics.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    setMongoConnectionState(true);

    // Ancien statut "claimed" → "remis" (lot effectivement remis)
    try {
      const r = await Participation.updateMany(
        { status: 'claimed' },
        { $set: { status: 'remis' } }
      );
      if (r.modifiedCount > 0) {
        console.log(`📦 Migration participations: ${r.modifiedCount} document(s) claimed → remis`);
      }
    } catch (e) {
      console.warn('Migration status participation ignorée:', e.message);
    }
    
    // Gestion de la déconnexion
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB déconnecté');
      setMongoConnectionState(false);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
      setMongoConnectionState(false);
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
