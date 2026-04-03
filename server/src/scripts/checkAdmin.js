import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thetiptop';

const run = async () => {
  try {
    await mongoose.connect(uri, { maxPoolSize: 5 });
    console.log('✅ Connecté à MongoDB (check)');
    const admin = await User.findOne({ email: 'admin@thetiptop.fr' }).select('+mot_de_passe_hash');
    if (!admin) {
      console.log('ℹ️ Aucun admin trouvé avec email admin@thetiptop.fr');
    } else {
      console.log('✅ Admin trouvé:');
      console.log({
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        isEmailVerified: admin.isEmailVerified,
        createdAt: admin.createdAt,
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la vérification admin:', err.message || err);
    process.exit(1);
  }
};

run();
