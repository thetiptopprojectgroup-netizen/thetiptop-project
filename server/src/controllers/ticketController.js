import Code, { PRIZES } from '../models/Ticket.js';
import Participation from '../models/Participation.js';
import RemiseLot from '../models/RemiseLot.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import { getContestDates } from '../utils/contestConfig.js';
import {
  sendPrizeDeliveredEmail,
  isPrizeDeliveredEmailConfigured,
} from '../services/emailjsService.js';

// @desc    Valider un ticket et participer au jeu
// @route   POST /api/tickets/validate
export const validateTicket = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const now = new Date();
    const { contest_start_date, claim_end_date } = await getContestDates();

    if (now < contest_start_date) {
      return next(new AppError("Le jeu-concours n'a pas encore commencé", 400));
    }
    if (now > claim_end_date) {
      return next(new AppError('La période de participation est terminée', 400));
    }

    const formattedCode = code.toUpperCase().replace(/\s/g, '');

    if (!/^[A-Z0-9]{10}$/.test(formattedCode)) {
      return next(new AppError('Format de code invalide. Le code doit contenir 10 caractères alphanumériques.', 400));
    }

    const codeDoc = await Code.findOne({ code: formattedCode });

    if (!codeDoc) {
      return next(new AppError('Code invalide. Vérifiez votre ticket.', 404));
    }

    if (codeDoc.etat !== 'disponible') {
      return next(new AppError('Ce code a déjà été utilisé', 400));
    }

    // Utiliser le code
    codeDoc.etat = 'utilise';
    codeDoc.utilise_par = userId;
    codeDoc.date_utilisation = new Date();
    await codeDoc.save();

    // Créer la participation
    const participation = await Participation.create({
      user: userId,
      ticket: codeDoc._id,
      prize: codeDoc.prize,
      status: 'won',
      gagnant: true,
      date_participation: new Date(),
      ip_adresse: req.ip,
      user_agent: req.get('User-Agent'),
    });

    await participation.populate('ticket');

    res.status(200).json({
      success: true,
      message: 'Félicitations ! Vous avez gagné !',
      data: {
        participation: {
          id: participation._id,
          ticketCode: codeDoc.code,
          prize: codeDoc.prize,
          status: participation.status,
          wonAt: participation.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une de mes participations (client uniquement, si non réclamée)
// @route   DELETE /api/tickets/my-participations/:id
export const deleteMyParticipation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const participation = await Participation.findOne({ _id: id, user: userId });
    if (!participation) {
      return next(new AppError('Participation introuvable ou vous n\'êtes pas autorisé à la supprimer', 404));
    }
    if (participation.status === 'remis') {
      return next(new AppError('Impossible de supprimer une participation dont le lot a déjà été remis', 400));
    }

    await Participation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Participation supprimée',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Historique des participations
// @route   GET /api/tickets/my-participations
export const getMyParticipations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const participations = await Participation.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('ticket');

    const formattedParticipations = participations.map((p) => ({
      id: p._id,
      ticketCode: p.ticket?.code,
      prize: p.prize,
      status: p.status,
      wonAt: p.createdAt,
      claimedAt: p.claimedAt,
      claimedMethod: p.claimedMethod,
    }));

    res.status(200).json({
      success: true,
      data: { participations: formattedParticipations, count: participations.length },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Détails d'un ticket (employés)
// @route   GET /api/tickets/:code
export const getTicketByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const formattedCode = code.toUpperCase().replace(/\s/g, '');

    const codeDoc = await Code.findOne({ code: formattedCode })
      .populate('utilise_par', 'prenom nom email');

    if (!codeDoc) {
      return next(new AppError('Ticket non trouvé', 404));
    }

    // Get associated participation
    const participation = await Participation.findOne({ ticket: codeDoc._id })
      .populate('user', 'prenom nom email');

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          code: codeDoc.code,
          prize: codeDoc.prize,
          status: codeDoc.etat === 'disponible' ? 'available' : codeDoc.etat === 'utilise' ? 'used' : codeDoc.etat,
          etat: codeDoc.etat,
          usedBy: codeDoc.utilise_par,
          date_utilisation: codeDoc.date_utilisation,
        },
        participation: participation ? {
          id: participation._id,
          user: participation.user,
          status: participation.status,
          claimedAt: participation.claimedAt,
          claimedMethod: participation.claimedMethod,
          date_participation: participation.date_participation,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demande de réclamation en ligne (enregistre la demande ; le lot sera « remis » en boutique par un employé)
// @route   POST /api/tickets/my-participations/:id/claim-online
export const claimMyPrizeOnline = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const now = new Date();
    const { claim_end_date } = await getContestDates();
    if (now > claim_end_date) {
      return next(new AppError('La période de réclamation en ligne est terminée', 400));
    }

    const participation = await Participation.findOneAndUpdate(
      { _id: id, user: userId, status: 'won' },
      {
        status: 'reclaim_requested',
        claimedAt: new Date(),
        claimedMethod: 'online',
      },
      { new: true }
    );

    if (!participation) {
      const existing = await Participation.findOne({ _id: id, user: userId });
      if (!existing) {
        return next(new AppError('Participation introuvable', 404));
      }
      if (existing.status === 'reclaim_requested') {
        return next(
          new AppError('Vous avez déjà enregistré une demande de réclamation pour ce lot', 400)
        );
      }
      if (existing.status === 'remis') {
        return next(new AppError('Ce lot a déjà été remis', 400));
      }
      return next(new AppError('Ce lot ne peut pas être réclamé en ligne dans son état actuel', 400));
    }

    const codeDoc = await Code.findById(participation.ticket);

    res.status(200).json({
      success: true,
      message:
        'Demande enregistrée. Présentez-vous en boutique avec votre code pour récupérer le lot.',
      data: {
        participation: {
          id: participation._id,
          ticketCode: codeDoc?.code,
          prize: participation.prize,
          status: participation.status,
          wonAt: participation.createdAt,
          claimedAt: participation.claimedAt,
          claimedMethod: participation.claimedMethod,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remettre physiquement le lot au client (employé / admin) — statut final « remis »
// @route   PUT /api/tickets/:code/claim
export const claimPrize = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { storeLocation } = req.body;
    const employeeId = req.user._id;

    const formattedCode = code.toUpperCase().replace(/\s/g, '');
    const codeDoc = await Code.findOne({ code: formattedCode });

    if (!codeDoc) {
      return next(new AppError('Ticket non trouvé', 404));
    }
    if (codeDoc.etat === 'disponible') {
      return next(new AppError("Ce ticket n'a pas encore été validé par un client", 400));
    }
    if (codeDoc.etat === 'reclame') {
      return next(new AppError('Ce lot a déjà été remis', 400));
    }

    const participation = await Participation.findOne({ ticket: codeDoc._id });
    if (!participation) {
      return next(new AppError('Participation introuvable pour ce ticket', 404));
    }
    if (participation.status === 'remis') {
      return next(new AppError('Ce lot a déjà été remis', 400));
    }
    if (!['won', 'reclaim_requested'].includes(participation.status)) {
      return next(new AppError('La remise de ce lot n’est pas possible dans l’état actuel', 400));
    }

    codeDoc.etat = 'reclame';
    await codeDoc.save();

    const wasOnlineRequest =
      participation.status === 'reclaim_requested' && participation.claimedMethod === 'online';

    participation.status = 'remis';
    participation.claimedAt = participation.claimedAt || new Date();
    if (!wasOnlineRequest) {
      participation.claimedMethod = 'store';
      participation.claimedInStore = storeLocation;
    }
    await participation.save();

    await RemiseLot.create({
      participation: participation._id,
      employe: employeeId,
      date_remise: new Date(),
      mode_remise: 'boutique',
      statut: 'remis',
      commentaire: wasOnlineRequest
        ? `Remis en boutique suite à une demande en ligne (${storeLocation || 'boutique'})`
        : `Remis en ${storeLocation || 'boutique'}`,
    });

    const winner = await User.findById(participation.user).select('email prenom nom');
    if (winner?.email && isPrizeDeliveredEmailConfigured()) {
      sendPrizeDeliveredEmail({
        email: winner.email,
        firstName: winner.prenom,
        lastName: winner.nom,
        prizeName: participation.prize?.name || 'Votre lot Thé Tip Top',
        prizeDescription: participation.prize?.description || '',
        ticketCode: formattedCode,
        storeLocation: storeLocation || '',
      }).catch((err) => {
        console.error('[Lot remis] Échec EmailJS attestation:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lot remis avec succès',
      data: { ticket: codeDoc, participation },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rechercher gains d'un client (employés)
// @route   GET /api/tickets/customer/:email
export const getCustomerPrizes = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return next(new AppError('Client non trouvé', 404));
    }

    const participations = await Participation.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('ticket');

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: user._id,
          fullName: user.nom_complet,
          email: user.email,
        },
        participations: participations.map((p) => ({
          id: p._id,
          ticketCode: p.ticket?.code,
          prize: p.prize,
          status: p.status,
          wonAt: p.createdAt,
          claimedAt: p.claimedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lots disponibles
// @route   GET /api/tickets/prizes
export const getPrizes = async (req, res, next) => {
  try {
    const prizes = Object.values(PRIZES).map((prize) => ({
      id: prize.id,
      name: prize.name,
      description: prize.description,
      value: prize.value,
      image: prize.image,
    }));

    res.status(200).json({
      success: true,
      data: { prizes },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Liste des lots remis (datatable employés / admin) — filtres optionnels
// @route   GET /api/tickets/remises
export const getRemisesLots = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { dateFrom, dateTo, email, firstName, lastName, ticketCode } = req.query;

    const collPart = Participation.collection.collectionName;
    const collUser = User.collection.collectionName;
    const collCode = Code.collection.collectionName;

    const matchRemise = {};
    if (dateFrom || dateTo) {
      matchRemise.date_remise = {};
      if (dateFrom) matchRemise.date_remise.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        matchRemise.date_remise.$lte = end;
      }
    }

    const pipeline = [
      { $match: matchRemise },
      { $lookup: { from: collPart, localField: 'participation', foreignField: '_id', as: 'part' } },
      { $unwind: '$part' },
      { $lookup: { from: collUser, localField: 'part.user', foreignField: '_id', as: 'usr' } },
      { $unwind: '$usr' },
      { $lookup: { from: collCode, localField: 'part.ticket', foreignField: '_id', as: 'tic' } },
      { $unwind: '$tic' },
    ];

    const matchUser = {};
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (email?.trim()) matchUser['usr.email'] = new RegExp(esc(email.trim()), 'i');
    if (firstName?.trim()) matchUser['usr.prenom'] = new RegExp(esc(firstName.trim()), 'i');
    if (lastName?.trim()) matchUser['usr.nom'] = new RegExp(esc(lastName.trim()), 'i');
    if (ticketCode?.trim()) {
      matchUser['tic.code'] = new RegExp(esc(ticketCode.trim().toUpperCase()), 'i');
    }
    if (Object.keys(matchUser).length) pipeline.push({ $match: matchUser });

    pipeline.push({ $lookup: { from: collUser, localField: 'employe', foreignField: '_id', as: 'emp' } });
    pipeline.push({ $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $sort: { date_remise: -1 } });
    pipeline.push({
      $facet: {
        meta: [{ $count: 'total' }],
        rows: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              id: '$_id',
              dateRemise: '$date_remise',
              modeRemise: '$mode_remise',
              statut: '$statut',
              commentaire: '$commentaire',
              prizeName: '$part.prize.name',
              prizeValue: '$part.prize.value',
              ticketCode: '$tic.code',
              clientEmail: '$usr.email',
              clientPrenom: '$usr.prenom',
              clientNom: '$usr.nom',
              remisPar:
                '$emp',
            },
          },
        ],
      },
    });

    const [agg] = await RemiseLot.aggregate(pipeline);
    const total = agg?.meta?.[0]?.total ?? 0;
    const rawRows = agg?.rows ?? [];

    const rows = rawRows.map((r) => ({
      id: r.id,
      dateRemise: r.dateRemise,
      modeRemise: r.modeRemise,
      statut: r.statut,
      commentaire: r.commentaire,
      prizeName: r.prizeName,
      prizeValue: r.prizeValue,
      ticketCode: r.ticketCode,
      clientEmail: r.clientEmail,
      clientPrenom: r.clientPrenom,
      clientNom: r.clientNom,
      remisPar:
        r.remisPar && r.remisPar.prenom
          ? `${r.remisPar.prenom} ${r.remisPar.nom}`.trim()
          : r.modeRemise === 'en_ligne'
            ? 'Client (en ligne)'
            : '—',
    }));

    res.status(200).json({
      success: true,
      data: {
        remises: rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lots en attente de remise physique (gagné ou demande en ligne — ticket pas encore « reclame »)
// @route   GET /api/tickets/pending-remises
export const getPendingLotsForRemise = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { dateFrom, dateTo, email, firstName, lastName, ticketCode, search } = req.query;

    const collUser = User.collection.collectionName;
    const collCode = Code.collection.collectionName;

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const pipeline = [
      {
        $match: {
          status: { $in: ['won', 'reclaim_requested'] },
        },
      },
      { $lookup: { from: collCode, localField: 'ticket', foreignField: '_id', as: 'tic' } },
      { $unwind: '$tic' },
      { $match: { 'tic.etat': 'utilise' } },
      { $lookup: { from: collUser, localField: 'user', foreignField: '_id', as: 'usr' } },
      { $unwind: '$usr' },
      {
        $addFields: {
          dateReclamation: { $ifNull: ['$claimedAt', '$createdAt'] },
        },
      },
    ];

    if (search?.trim()) {
      const rx = new RegExp(esc(search.trim()), 'i');
      pipeline.push({
        $match: {
          $or: [{ 'usr.email': rx }, { 'usr.prenom': rx }, { 'usr.nom': rx }],
        },
      });
    } else {
      const matchUser = {};
      if (email?.trim()) matchUser['usr.email'] = new RegExp(esc(email.trim()), 'i');
      if (firstName?.trim()) matchUser['usr.prenom'] = new RegExp(esc(firstName.trim()), 'i');
      if (lastName?.trim()) matchUser['usr.nom'] = new RegExp(esc(lastName.trim()), 'i');
      if (ticketCode?.trim()) {
        matchUser['tic.code'] = new RegExp(esc(ticketCode.trim().toUpperCase()), 'i');
      }
      if (Object.keys(matchUser).length) pipeline.push({ $match: matchUser });
    }

    if (search?.trim() && ticketCode?.trim()) {
      pipeline.push({
        $match: {
          'tic.code': new RegExp(esc(ticketCode.trim().toUpperCase()), 'i'),
        },
      });
    }

    if (dateFrom || dateTo) {
      const dr = {};
      if (dateFrom) dr.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dr.$lte = end;
      }
      pipeline.push({ $match: { dateReclamation: dr } });
    }

    pipeline.push({ $sort: { dateReclamation: -1 } });
    pipeline.push({
      $facet: {
        meta: [{ $count: 'total' }],
        rows: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              id: '$_id',
              ticketCode: '$tic.code',
              clientEmail: '$usr.email',
              clientPrenom: '$usr.prenom',
              clientNom: '$usr.nom',
              prizeName: '$prize.name',
              prizeValue: '$prize.value',
              status: '$status',
              claimedAt: '$claimedAt',
              claimedMethod: '$claimedMethod',
              dateReclamation: 1,
            },
          },
        ],
      },
    });

    const [agg] = await Participation.aggregate(pipeline);
    const total = agg?.meta?.[0]?.total ?? 0;
    const rows = agg?.rows ?? [];

    res.status(200).json({
      success: true,
      data: {
        rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Recherche clients + codes ticket (autocomplétion employés)
// @route   GET /api/tickets/customers/search
export const searchCustomers = async (req, res, next) => {
  try {
    const qRaw = (req.query.q || '').trim();
    if (qRaw.length < 2) {
      return res.status(200).json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suggestions = [];
    const seen = new Set();

    const codeUpper = qRaw.toUpperCase().replace(/\s/g, '');

    // 1) Code ticket exact (10 caractères)
    if (/^[A-Z0-9]{10}$/.test(codeUpper)) {
      const codeDoc = await Code.findOne({ code: codeUpper }).populate('utilise_par', 'email prenom nom');
      if (codeDoc?.utilise_par) {
        const u = codeDoc.utilise_par;
        const key = `t:${codeDoc.code}`;
        seen.add(key);
        suggestions.push({
          type: 'ticket',
          ticketCode: codeDoc.code,
          firstName: u.prenom,
          lastName: u.nom,
          fullName: `${u.prenom} ${u.nom}`,
          email: u.email,
          userId: u._id,
        });
      }
    }

    // 2) Préfixe de code (3–9 caractères alphanum)
    if (codeUpper.length >= 3 && codeUpper.length < 10 && /^[A-Z0-9]+$/.test(codeUpper)) {
      const codes = await Code.find({ code: new RegExp(`^${escapeRegex(codeUpper)}`, 'i') })
        .limit(10)
        .populate('utilise_par', 'email prenom nom');
      for (const c of codes) {
        if (!c.utilise_par) continue;
        const key = `t:${c.code}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const u = c.utilise_par;
        suggestions.push({
          type: 'ticket',
          ticketCode: c.code,
          firstName: u.prenom,
          lastName: u.nom,
          fullName: `${u.prenom} ${u.nom}`,
          email: u.email,
          userId: u._id,
        });
      }
    }

    // 3) Clients par email / prénom / nom
    const searchRegex = new RegExp(escapeRegex(qRaw), 'i');
    const users = await User.find({
      role: 'user',
      actif: true,
      $or: [{ email: searchRegex }, { prenom: searchRegex }, { nom: searchRegex }],
    })
      .select('email prenom nom')
      .limit(25)
      .sort({ prenom: 1 });

    const userIds = users.map((u) => u._id);
    const participations =
      userIds.length > 0
        ? await Participation.find({ user: { $in: userIds } })
            .populate('ticket', 'code')
            .lean()
        : [];
    const codesByUser = {};
    for (const p of participations) {
      const uid = p.user.toString();
      if (!codesByUser[uid]) codesByUser[uid] = [];
      if (p.ticket?.code) codesByUser[uid].push(p.ticket.code);
    }

    for (const c of users) {
      const uid = c._id.toString();
      const key = `u:${uid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        type: 'user',
        userId: c._id,
        email: c.email,
        firstName: c.prenom,
        lastName: c.nom,
        fullName: `${c.prenom} ${c.nom}`,
        ticketCodes: codesByUser[uid] || [],
      });
    }

    suggestions.sort((a, b) => {
      const t = a.type === 'ticket' ? -1 : a.type === 'user' ? 1 : 0;
      const u = b.type === 'ticket' ? -1 : b.type === 'user' ? 1 : 0;
      if (t !== u) return t - u;
      return (a.fullName || '').localeCompare(b.fullName || '', 'fr');
    });
    const seenUid = new Set();
    const deduped = [];
    for (const s of suggestions) {
      const id = s.userId?.toString();
      if (!id) {
        deduped.push(s);
        continue;
      }
      if (seenUid.has(id)) continue;
      seenUid.add(id);
      deduped.push(s);
    }

    res.status(200).json({
      success: true,
      data: { suggestions: deduped.slice(0, 20) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier un code
// @route   GET /api/tickets/check/:code
export const checkTicket = async (req, res, next) => {
  try {
    const { code } = req.params;
    const formattedCode = code.toUpperCase().replace(/\s/g, '');

    if (!/^[A-Z0-9]{10}$/.test(formattedCode)) {
      return res.status(200).json({
        success: true,
        data: { valid: false, message: 'Format de code invalide' },
      });
    }

    const codeDoc = await Code.findOne({ code: formattedCode });

    if (!codeDoc) {
      return res.status(200).json({
        success: true,
        data: { valid: false, message: 'Code non trouvé' },
      });
    }

    const isAvailable = codeDoc.etat === 'disponible';

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        available: isAvailable,
        message: isAvailable ? 'Code valide et disponible' : 'Ce code a déjà été utilisé',
      },
    });
  } catch (error) {
    next(error);
  }
};
