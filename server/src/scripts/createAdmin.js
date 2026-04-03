import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Boutique from '../models/Boutique.js';
import EmployeBoutique from '../models/EmployeBoutique.js';
import Huissier from '../models/Huissier.js';

dotenv.config();

const createAdmin = async () => {
  try {
    const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thetiptop';
    const maskUri = (uri) => {
      try {
        // mask credentials if present
        return uri.replace(/([^:]+):([^@]+)@/, '****:****@');
      } catch (e) {
        return uri;
      }
    };

    console.log('🚀 Connexion à MongoDB...');
    console.log(`🔎 URI utilisée: ${maskUri(rawUri)}`);
    await mongoose.connect(rawUri, { maxPoolSize: 10 });
    console.log('✅ Connecté à MongoDB');

    const adminEmail = process.argv[2] || 'admin@thetiptop.fr';
    const adminPassword = process.argv[3] || 'Admin123!';

    // === Administrateur (MCD: Administrateur) ===
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`✅ Utilisateur ${adminEmail} promu en admin`);
      } else {
        console.log(`⚠️ L'admin ${adminEmail} existe déjà`);
      }
    } else {
      await User.create({
        email: adminEmail,
        mot_de_passe_hash: adminPassword,
        prenom: 'Admin',
        nom: 'ThéTipTop',
        role: 'admin',
        date_consentement: new Date(),
        isEmailVerified: true,
        type_authentification: 'local',
      });
      console.log(`✅ Admin créé: ${adminEmail}`);
    }

    // === Boutiques (MCD: BOUTIQUE) ===
    const boutiques = [
      { nom: 'Thé Tip Top - Nice Centre', adresse: '15 Avenue Jean Médecin', code_postal: '06000', ville: 'Nice', telephone: '04 93 00 00 01', email: 'nice-centre@thetiptop.fr', date_ouverture: new Date('2024-01-15') },
      { nom: 'Thé Tip Top - Nice Port', adresse: '32 Quai Lunel', code_postal: '06300', ville: 'Nice', telephone: '04 93 00 00 02', email: 'nice-port@thetiptop.fr', date_ouverture: new Date('2024-06-01') },
      { nom: 'Thé Tip Top - Paris Marais', adresse: '45 Rue de Rivoli', code_postal: '75004', ville: 'Paris', telephone: '01 42 00 00 01', email: 'paris-marais@thetiptop.fr', date_ouverture: new Date('2022-03-10') },
      { nom: 'Thé Tip Top - Lyon Bellecour', adresse: '12 Place Bellecour', code_postal: '69002', ville: 'Lyon', telephone: '04 72 00 00 01', email: 'lyon@thetiptop.fr', date_ouverture: new Date('2023-01-20') },
    ];

    for (const b of boutiques) {
      const exists = await Boutique.findOne({ email: b.email });
      if (!exists) {
        await Boutique.create(b);
        console.log(`✅ Boutique créée: ${b.nom}`);
      }
    }

    // === Employé de test (MCD: EMPLOYE_BOUTIQUE) ===
    const boutique = await Boutique.findOne({ ville: 'Nice' });
    const employeeEmail = 'employe@thetiptop.fr';
    const existingEmployee = await User.findOne({ email: employeeEmail });
    if (!existingEmployee) {
      await User.create({
        email: employeeEmail,
        mot_de_passe_hash: 'Employe123!',
        prenom: 'Marie',
        nom: 'Dupont',
        role: 'employee',
        date_consentement: new Date(),
        isEmailVerified: true,
        type_authentification: 'local',
      });
      console.log(`✅ Employé créé: ${employeeEmail}`);

      if (boutique) {
        await EmployeBoutique.create({
          nom: 'Dupont',
          prenom: 'Marie',
          email: employeeEmail,
          mot_de_passe_hash: 'Employe123!',
          boutique: boutique._id,
        });
        console.log(`✅ Lien employé-boutique créé`);
      }
    }

    // === Huissier (MCD: HUISSIER) ===
    const existingHuissier = await Huissier.findOne({ numero_huissier: 'HJ-75-2024-001' });
    if (!existingHuissier) {
      await Huissier.create({
        nom: 'Rick',
        prenom: 'Arnaud',
        titre: 'Maître',
        cabinet: 'Cabinet Rick & Associés',
        adresse: '25 Rue de la Paix, 75002 Paris',
        telephone: '01 42 00 00 99',
        email: 'arnaud.rick@huissier.fr',
        numero_huissier: 'HJ-75-2024-001',
      });
      console.log('✅ Huissier créé: Maître Arnaud Rick');
    }

    process.exit(0);
  } catch (error) {
      console.error('❌ Erreur:', error);
      if (error && (error.code === 13 || (error.message && error.message.toLowerCase().includes('requires authentication')))) {
        console.error('\n🔐 Erreur d\'authentification MongoDB: la commande a échoué car la base exige des identifiants.');
        console.error('→ Assurez-vous que `MONGODB_URI` contient un utilisateur/mot de passe valides, par exemple:');
        console.error('   mongodb://user:password@host:27017/thetiptop?authSource=admin');
        console.error('→ Ou démarrez MongoDB sans authentification (ex: `docker run -d -p 27017:27017 --name mongodb mongo:7.0`).');
      }
    process.exit(1);
  }
};

createAdmin();
