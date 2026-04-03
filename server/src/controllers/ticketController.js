import Code, { PRIZES } from '../models/Ticket.js';
import Participation from '../models/Participation.js';
import RemiseLot from '../models/RemiseLot.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import { getContestDates } from '../utils/contestConfig.js';

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
    if (participation.status === 'claimed') {
      return next(new AppError('Impossible de supprimer une participation dont le lot a déjà été récupéré', 400));
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
          date_participation: participation.date_participation,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Marquer un lot comme remis (employés)
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

    // Marquer le code comme réclamé
    codeDoc.etat = 'reclame';
    await codeDoc.save();

    // Mettre à jour la participation
    const participation = await Participation.findOneAndUpdate(
      { ticket: codeDoc._id },
      {
        status: 'claimed',
        claimedAt: new Date(),
        claimedMethod: 'store',
        claimedInStore: storeLocation,
      },
      { new: true }
    );

    // Créer l'enregistrement de remise de lot (MCD: REMISE_LOT)
    await RemiseLot.create({
      participation: participation._id,
      employe: employeeId,
      date_remise: new Date(),
      mode_remise: 'boutique',
      statut: 'remis',
      commentaire: `Remis en ${storeLocation || 'boutique'}`,
    });

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

// @desc    Recherche clients avec autocomplétion (employés)
// @route   GET /api/tickets/customers/search
export const searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: { customers: [] },
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const customers = await User.find({
      role: 'user',
      actif: true,
      $or: [
        { email: searchRegex },
        { prenom: searchRegex },
        { nom: searchRegex },
      ],
    })
      .select('email prenom nom')
      .limit(10)
      .sort({ prenom: 1 });

    res.status(200).json({
      success: true,
      data: {
        customers: customers.map((c) => ({
          id: c._id,
          email: c.email,
          fullName: `${c.prenom} ${c.nom}`,
          firstName: c.prenom,
          lastName: c.nom,
        })),
      },
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
