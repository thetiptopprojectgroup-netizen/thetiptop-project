import Code, { PRIZES } from '../models/Ticket.js';
import Lot from '../models/Lot.js';
import Participation from '../models/Participation.js';
import User from '../models/User.js';
import TirageAuSort from '../models/TirageAuSort.js';
import Huissier from '../models/Huissier.js';
import Boutique from '../models/Boutique.js';
import EmployeBoutique from '../models/EmployeBoutique.js';
import RemiseLot from '../models/RemiseLot.js';
import ContestConfig from '../models/ContestConfig.js';
import { AppError } from '../middlewares/errorHandler.js';

// @desc    Récupérer la configuration du concours
// @route   GET /api/admin/contest-config
export const getContestConfig = async (req, res, next) => {
  try {
    let config = await ContestConfig.findOne();
    
    // Si aucune config existe, en créer une par défaut
    if (!config) {
      config = await ContestConfig.create({});
    }
    
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour la configuration du concours
// @route   PUT /api/admin/contest-config
export const updateContestConfig = async (req, res, next) => {
  try {
    const { contest_start_date, contest_end_date, claim_end_date } = req.body;

    // Validation des dates
    if (!contest_start_date || !contest_end_date || !claim_end_date) {
      return next(new AppError('Toutes les dates sont requises', 400));
    }

    const start = new Date(contest_start_date);
    const end = new Date(contest_end_date);
    const claim = new Date(claim_end_date);

    // Validation : start < end < claim
    if (start >= end) {
      return next(new AppError('La date de début doit être avant la date de fin', 400));
    }

    if (end >= claim) {
      return next(new AppError('La date de fin doit être avant la date de réclamation', 400));
    }

    let config = await ContestConfig.findOne();
    
    if (!config) {
      config = await ContestConfig.create({
        contest_start_date: start,
        contest_end_date: end,
        claim_end_date: claim,
      });
    } else {
      config.contest_start_date = start;
      config.contest_end_date = end;
      config.claim_end_date = claim;
      await config.save();
    }

    res.status(200).json({
      success: true,
      message: 'Configuration du concours mise à jour',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Statistiques globales
// @route   GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const totalCodes = await Code.countDocuments();
    const usedCodes = await Code.countDocuments({ etat: { $in: ['utilise', 'reclame'] } });
    const claimedCodes = await Code.countDocuments({ etat: 'reclame' });
    const availableCodes = await Code.countDocuments({ etat: 'disponible' });

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalParticipants = await Participation.distinct('user').then((arr) => arr.length);
    const usersWithMarketing = await User.countDocuments({ role: 'user', consentement_marketing: true });

    const prizeStats = await Code.aggregate([
      { $match: { etat: { $in: ['utilise', 'reclame'] } } },
      {
        $group: {
          _id: '$prize.id',
          count: { $sum: 1 },
          claimed: { $sum: { $cond: [{ $eq: ['$etat', 'reclame'] }, 1, 0] } },
        },
      },
    ]);

    const prizeStatsFormatted = Object.values(PRIZES).map((prize) => {
      const stat = prizeStats.find((s) => s._id === prize.id) || { count: 0, claimed: 0 };
      const total = Math.round((prize.percentage / 100) * totalCodes);
      return {
        id: prize.id,
        name: prize.name,
        won: stat.count,
        claimed: stat.claimed,
        pending: stat.count - stat.claimed,
        total,
      };
    });

    const genderStats = await Participation.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      { $group: { _id: '$userInfo.sexe', count: { $sum: 1 } } },
    ]);

    const ageStats = await Participation.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.date_naissance': { $exists: true } } },
      {
        $project: {
          age: {
            $floor: {
              $divide: [{ $subtract: [new Date(), '$userInfo.date_naissance'] }, 365.25 * 24 * 60 * 60 * 1000],
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [18, 25, 35, 45, 55, 65, 100],
          default: 'unknown',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const dailyParticipations = await Participation.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // Boutiques stats
    const totalBoutiques = await Boutique.countDocuments({ actif: true });

    res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: totalCodes,
          used: usedCodes,
          claimed: claimedCodes,
          available: availableCodes,
          usageRate: totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(2) : 0,
        },
        users: {
          total: totalUsers,
          participants: totalParticipants,
          withParticipation: totalParticipants,
          marketingConsent: usersWithMarketing,
          conversionRate: totalUsers > 0 ? ((totalParticipants / totalUsers) * 100).toFixed(2) : 0,
        },
        prizes: prizeStatsFormatted,
        boutiques: { total: totalBoutiques },
        demographics: { gender: genderStats, age: ageStats },
        timeline: dailyParticipations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste utilisateurs emailing
// @route   GET /api/admin/users/emailing
export const getUsersForEmailing = async (req, res, next) => {
  try {
    const { consent, participated, page = 1, limit = 50 } = req.query;
    const filter = { role: 'user' };
    if (consent === 'true') filter.consentement_marketing = true;

    let users = await User.find(filter)
      .select('email prenom nom consentement_marketing')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (participated === 'true' || participated === 'false') {
      const participantIds = await Participation.distinct('user');
      if (participated === 'true') {
        users = users.filter((u) => participantIds.some((id) => id.equals(u._id)));
      } else {
        users = users.filter((u) => !participantIds.some((id) => id.equals(u._id)));
      }
    }

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(u => ({ email: u.email, firstName: u.prenom, lastName: u.nom, marketingConsent: u.consentement_marketing })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export emails CSV
// @route   GET /api/admin/users/export
export const exportEmails = async (req, res, next) => {
  try {
    const { consent = 'true' } = req.query;
    const filter = { role: 'user' };
    if (consent === 'true') filter.consentement_marketing = true;

    const users = await User.find(filter).select('email prenom nom');
    const csv = ['Email,Prénom,Nom'];
    users.forEach((u) => csv.push(`${u.email},${u.prenom},${u.nom}`));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=emails-export.csv');
    res.send(csv.join('\n'));
  } catch (error) {
    next(error);
  }
};

// @desc    Tirage au sort gros lot (MCD: TIRAGE_AU_SORT)
// @route   POST /api/admin/grand-prize/draw
export const drawGrandPrize = async (req, res, next) => {
  try {
    const existingDraw = await TirageAuSort.findOne({ statut: 'termine' });
    if (existingDraw) {
      return next(new AppError('Le tirage au sort a déjà été effectué', 400));
    }

    const contestEnd = new Date(process.env.CONTEST_END_DATE || '2026-03-30');
    const now = new Date();
    if (now < contestEnd) {
      return next(new AppError("Le jeu-concours n'est pas encore terminé", 400));
    }

    const eligibleParticipants = await Participation.find({ eligible_tirage_final: true }).distinct('user');
    if (eligibleParticipants.length === 0) {
      return next(new AppError('Aucun participant éligible', 400));
    }

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const winnerId = eligibleParticipants[randomIndex];

    // Find or create huissier
    let huissier = await Huissier.findOne();
    if (!huissier) {
      huissier = await Huissier.create({
        nom: 'Rick',
        prenom: 'Arnaud',
        titre: 'Maître',
        cabinet: 'Cabinet Rick & Associés',
        numero_huissier: 'HJ-75-2024-001',
      });
    }

    const tirage = await TirageAuSort.create({
      date_tirage: new Date(),
      statut: 'termine',
      nombre_participant: eligibleParticipants.length,
      gagnant: winnerId,
      huissier: huissier._id,
      administrateur: req.user._id,
    });

    await tirage.populate('gagnant', 'prenom nom email');
    await tirage.populate('huissier');

    res.status(200).json({
      success: true,
      message: 'Tirage au sort effectué avec succès',
      data: {
        grandPrize: {
          winner: {
            id: tirage.gagnant._id,
            firstName: tirage.gagnant.prenom,
            lastName: tirage.gagnant.nom,
            name: tirage.gagnant.nom_complet,
            email: tirage.gagnant.email,
          },
          prize: tirage.lot_gros_lot,
          drawDate: tirage.date_tirage,
          totalParticipants: tirage.nombre_participant,
          verificationCode: tirage.code_verification,
          huissier: tirage.huissier.nom_complet,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Résultats du tirage
// @route   GET /api/admin/grand-prize
export const getGrandPrizeResult = async (req, res, next) => {
  try {
    const tirage = await TirageAuSort.findOne({ statut: 'termine' })
      .populate('gagnant', 'prenom nom email telephone')
      .populate('huissier');

    if (!tirage) {
      return res.status(200).json({
        success: true,
        data: { drawn: false, message: "Le tirage au sort n'a pas encore été effectué" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        drawn: true,
        grandPrize: {
          winner: {
            id: tirage.gagnant._id,
            firstName: tirage.gagnant.prenom,
            lastName: tirage.gagnant.nom,
            email: tirage.gagnant.email,
          },
          prize: tirage.lot_gros_lot,
          drawDate: tirage.date_tirage,
          totalParticipants: tirage.nombre_participant,
          verificationCode: tirage.code_verification,
          isClaimed: tirage.est_reclame,
          claimedAt: tirage.date_reclamation,
          huissier: tirage.huissier?.nom_complet,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste utilisateurs
// @route   GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-mot_de_passe_hash')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(u => u.toPublicJSON()),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier rôle
// @route   PUT /api/admin/users/:id/role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'employee', 'admin'].includes(role)) {
      return next(new AppError('Rôle invalide', 400));
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!user) return next(new AppError('Utilisateur non trouvé', 404));

    res.status(200).json({
      success: true,
      message: 'Rôle mis à jour',
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gérer les boutiques
// @route   GET /api/admin/boutiques
export const getBoutiques = async (req, res, next) => {
  try {
    const boutiques = await Boutique.find().sort({ nom: 1 });
    res.status(200).json({ success: true, data: { boutiques } });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une boutique
// @route   POST /api/admin/boutiques
export const createBoutique = async (req, res, next) => {
  try {
    const boutique = await Boutique.create(req.body);
    res.status(201).json({ success: true, data: { boutique } });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier une boutique
// @route   PUT /api/admin/boutiques/:id
export const updateBoutique = async (req, res, next) => {
  try {
    const { id } = req.params;
    const boutique = await Boutique.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!boutique) return next(new AppError('Boutique non trouvée', 404));
    res.status(200).json({ success: true, data: { boutique } });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer (désactiver) une boutique
// @route   DELETE /api/admin/boutiques/:id
export const deleteBoutique = async (req, res, next) => {
  try {
    const { id } = req.params;
    const boutique = await Boutique.findByIdAndUpdate(id, { actif: false }, { new: true });
    if (!boutique) return next(new AppError('Boutique non trouvée', 404));
    res.status(200).json({ success: true, message: 'Boutique désactivée' });
  } catch (error) {
    next(error);
  }
};

// @desc    Désactiver/activer un utilisateur
// @route   PUT /api/admin/users/:id/status
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    const user = await User.findByIdAndUpdate(id, { actif }, { new: true });
    if (!user) return next(new AppError('Utilisateur non trouvé', 404));
    res.status(200).json({
      success: true,
      message: actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return next(new AppError('Vous ne pouvez pas supprimer votre propre compte', 400));
    }
    const user = await User.findById(id);
    if (!user) return next(new AppError('Utilisateur non trouvé', 404));
    user.actif = false;
    await user.save();
    res.status(200).json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste des employés boutique
// @route   GET /api/admin/employees
export const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, boutique } = req.query;
    const filter = {};
    if (boutique) filter.boutique = boutique;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
      ];
    }
    const employees = await EmployeBoutique.find(filter)
      .select('-mot_de_passe_hash')
      .populate('boutique', 'nom ville')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await EmployeBoutique.countDocuments(filter);
    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un employé
// @route   POST /api/admin/employees
export const createEmployee = async (req, res, next) => {
  try {
    const { nom, prenom, email, password, role, boutique } = req.body;
    const existing = await EmployeBoutique.findOne({ email: email.toLowerCase() });
    if (existing) return next(new AppError('Un employé avec cet email existe déjà', 400));
    const employee = await EmployeBoutique.create({
      nom, prenom, email, mot_de_passe_hash: password, role: role || 'employee', boutique,
    });
    const populated = await employee.populate('boutique', 'nom ville');
    res.status(201).json({ success: true, data: { employee: populated } });
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier un employé
// @route   PUT /api/admin/employees/:id
export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role, boutique, actif } = req.body;
    const employee = await EmployeBoutique.findByIdAndUpdate(
      id,
      { nom, prenom, email, role, boutique, actif },
      { new: true, runValidators: true }
    ).populate('boutique', 'nom ville');
    if (!employee) return next(new AppError('Employé non trouvé', 404));
    res.status(200).json({ success: true, data: { employee } });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un employé
// @route   DELETE /api/admin/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await EmployeBoutique.findByIdAndUpdate(id, { actif: false }, { new: true });
    if (!employee) return next(new AppError('Employé non trouvé', 404));
    res.status(200).json({ success: true, message: 'Employé désactivé' });
  } catch (error) {
    next(error);
  }
};

// @desc    Configuration de la session de jeu
// @route   GET /api/admin/game-session
export const getGameSession = async (req, res, next) => {
  try {
    const totalCodes = await Code.countDocuments();
    const usedCodes = await Code.countDocuments({ etat: { $in: ['utilise', 'reclame'] } });

    const prizeDistribution = Object.values(PRIZES).map((prize) => ({
      id: prize.id,
      name: prize.name,
      percentage: prize.percentage,
      value: prize.value,
      total: Math.round((prize.percentage / 100) * totalCodes),
    }));

    res.status(200).json({
      success: true,
      data: {
        session: {
          startDate: process.env.CONTEST_START_DATE || '2026-03-01',
          endDate: process.env.CONTEST_END_DATE || '2026-03-30',
          claimEndDate: process.env.CLAIM_END_DATE || '2026-04-29',
          maxTickets: parseInt(process.env.MAX_TICKETS) || 500000,
          totalCodes,
          usedCodes,
          availableCodes: totalCodes - usedCodes,
        },
        prizeDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Statistiques détaillées du jeu
// @route   GET /api/admin/game-stats
export const getGameStats = async (req, res, next) => {
  try {
    const totalCodes = await Code.countDocuments();
    const usedCodes = await Code.countDocuments({ etat: { $in: ['utilise', 'reclame'] } });
    const claimedCodes = await Code.countDocuments({ etat: 'reclame' });
    const expiredCodes = await Code.countDocuments({ etat: 'expire' });

    const dailyParticipations = await Participation.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hourlyParticipations = await Participation.aggregate([
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const topStores = await RemiseLot.aggregate([
      { $match: { statut: 'remis' } },
      { $lookup: { from: 'boutiques', localField: 'boutique', foreignField: '_id', as: 'boutiqueInfo' } },
      { $unwind: { path: '$boutiqueInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$boutique', count: { $sum: 1 }, nom: { $first: '$boutiqueInfo.nom' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const claimsByMode = await RemiseLot.aggregate([
      { $group: { _id: '$mode_remise', count: { $sum: 1 } } },
    ]);

    const totalPrizeValue = await Participation.aggregate([
      { $group: { _id: null, total: { $sum: '$prize.value' } } },
    ]);

    const tirage = await TirageAuSort.findOne({ statut: 'termine' }).populate('gagnant', 'prenom nom email');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCodes,
          usedCodes,
          claimedCodes,
          expiredCodes,
          pendingClaims: usedCodes - claimedCodes,
          usageRate: totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(2) : 0,
          claimRate: usedCodes > 0 ? ((claimedCodes / usedCodes) * 100).toFixed(2) : 0,
          totalPrizeValue: totalPrizeValue[0]?.total || 0,
        },
        dailyParticipations,
        hourlyParticipations,
        topStores,
        claimsByMode,
        grandPrize: tirage ? {
          drawn: true,
          winner: tirage.gagnant ? `${tirage.gagnant.prenom} ${tirage.gagnant.nom}` : null,
          date: tirage.date_tirage,
          claimed: tirage.est_reclame,
        } : { drawn: false },
      },
    });
  } catch (error) {
    next(error);
  }
};

const mapCodeForAdmin = (c) => ({
  id: c._id,
  code: c.code,
  etat: c.etat,
  date_generation: c.date_generation,
  date_utilisation: c.date_utilisation,
  prize: c.prize,
  lot: c.lot,
  createdAt: c.createdAt,
});

// @desc    Deux exemples de codes par type de lot (aperçu)
// @route   GET /api/admin/codes/samples
export const getAdminCodeSamples = async (req, res, next) => {
  try {
    const samples = [];
    for (const prize of Object.values(PRIZES)) {
      const codes = await Code.find({ 'prize.id': prize.id })
        .sort({ code: 1 })
        .limit(2)
        .populate('lot', 'libelle type_lot')
        .lean();
      samples.push({
        prize: { id: prize.id, name: prize.name },
        examples: codes.map(mapCodeForAdmin),
      });
    }
    res.status(200).json({
      success: true,
      data: { samples },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste paginée des codes (tickets générés)
// @route   GET /api/admin/codes
export const getAdminCodes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const sortField = ['code', 'date_generation', 'etat', 'createdAt'].includes(req.query.sort)
      ? req.query.sort
      : 'code';
    const order = req.query.order === 'desc' ? -1 : 1;
    const filter = {};
    if (req.query.etat && ['disponible', 'utilise', 'reclame', 'expire'].includes(req.query.etat)) {
      filter.etat = req.query.etat;
    }
    if (req.query.prizeId) {
      filter['prize.id'] = String(req.query.prizeId);
    }
    const skip = (page - 1) * limit;
    const sortObj = { [sortField]: order };
    const [codes, total] = await Promise.all([
      Code.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('lot', 'libelle type_lot')
        .lean(),
      Code.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: {
        codes: codes.map(mapCodeForAdmin),
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
