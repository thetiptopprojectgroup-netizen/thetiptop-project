import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Code, { PRIZES } from '../models/Ticket.js';
import Lot, { LOT_DEFINITIONS } from '../models/Lot.js';

dotenv.config();

/** Nombre de codes à créer au premier seed uniquement (voir seed-app-users.sh). Défaut 500000. */
function resolveTicketCount() {
  const raw = process.env.SEED_TICKET_COUNT ?? process.env.TOTAL_TICKETS;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return 500000;
  }
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) {
    console.warn('⚠️ SEED_TICKET_COUNT invalide, utilisation de 500000.');
    return 500000;
  }
  const cap = 10_000_000;
  if (n > cap) {
    console.warn(`⚠️ SEED_TICKET_COUNT plafonné à ${cap.toLocaleString()}.`);
    return cap;
  }
  return n;
}

const TOTAL_TICKETS = resolveTicketCount();
const BATCH_SIZE = 10000;

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const seedTickets = async () => {
  try {
    console.log('🚀 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thetiptop');
    console.log('✅ Connecté à MongoDB');

    // === Seed LOT entities (MCD: LOT) ===
    console.log('\n📦 Création/mise à jour des lots...');
    const lotMap = {};
    for (const def of LOT_DEFINITIONS) {
      let lot = await Lot.findOne({ type_lot: def.type_lot });
      if (!lot) {
        lot = await Lot.create(def);
        console.log(`  ✅ Lot créé: ${def.libelle}`);
      } else {
        console.log(`  ⚠️ Lot existe: ${def.libelle}`);
      }
      lotMap[def.type_lot] = lot._id;
    }

    // === Check existing codes (idempotent : ne jamais régénérer au déploiement si déjà présent) ===
    const existingCount = await Code.countDocuments();
    if (existingCount > 0) {
      console.log(`\n✅ ${existingCount.toLocaleString()} code(s) déjà en base — aucune régénération.`);
      if (!process.argv.includes('--force')) {
        console.log('   (Pour tout effacer et régénérer : node src/scripts/seedTickets.js --force)');
        await mongoose.disconnect();
        process.exit(0);
      }
      console.log('🗑️ Option --force : suppression des codes existants...');
      await Code.deleteMany({});
    }

    console.log(`\n📝 Génération de ${TOTAL_TICKETS.toLocaleString()} codes...`);
    const prizeList = Object.values(PRIZES);
    console.log('Distribution prévue:');
    prizeList.forEach(prize => {
      const count = Math.round((prize.percentage / 100) * TOTAL_TICKETS);
      console.log(`  - ${prize.name}: ${count.toLocaleString()} (${prize.percentage}%)`);
    });

    const startTime = Date.now();

    // Generate codes with correct distribution
    const distribution = prizeList.map(prize => ({
      prize,
      count: Math.round((prize.percentage / 100) * TOTAL_TICKETS),
      generated: 0,
    }));

    let total = distribution.reduce((sum, d) => sum + d.count, 0);
    if (total !== TOTAL_TICKETS) {
      distribution[0].count += TOTAL_TICKETS - total;
    }

    const allCodes = [];
    const usedCodes = new Set();

    for (const dist of distribution) {
      for (let i = 0; i < dist.count; i++) {
        let code;
        do {
          code = generateCode();
        } while (usedCodes.has(code));
        usedCodes.add(code);

        allCodes.push({
          code,
          lot: lotMap[dist.prize.id],
          prize: {
            id: dist.prize.id,
            name: dist.prize.name,
            description: dist.prize.description,
            value: dist.prize.value,
            image: dist.prize.image,
          },
          etat: 'disponible',
        });
      }
    }

    // Shuffle
    for (let i = allCodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCodes[i], allCodes[j]] = [allCodes[j], allCodes[i]];
    }

    // Insert in batches
    console.log('\n💾 Insertion en base de données...');
    for (let i = 0; i < allCodes.length; i += BATCH_SIZE) {
      const batch = allCodes.slice(i, i + BATCH_SIZE);
      await Code.insertMany(batch, { ordered: false });
      const progress = Math.min(i + BATCH_SIZE, allCodes.length);
      const percent = ((progress / allCodes.length) * 100).toFixed(1);
      process.stdout.write(`\r  Progression: ${progress.toLocaleString()} / ${allCodes.length.toLocaleString()} (${percent}%)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n✅ Génération terminée en ${duration}s`);

    // Verify
    const stats = await Code.aggregate([
      { $group: { _id: '$prize.id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.log('\n📊 Vérification:');
    stats.forEach(stat => {
      const prize = prizeList.find(p => p.id === stat._id);
      const pct = ((stat.count / TOTAL_TICKETS) * 100).toFixed(2);
      console.log(`  - ${prize?.name || stat._id}: ${stat.count.toLocaleString()} (${pct}%)`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* ignore */
    }
    process.exit(1);
  }
};

seedTickets();
