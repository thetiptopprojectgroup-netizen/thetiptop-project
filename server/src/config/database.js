import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    
    // Gestion de la déconnexion
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB déconnecté');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
