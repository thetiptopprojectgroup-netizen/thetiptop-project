import express from 'express';
import authRoutes from './authRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import adminRoutes from './adminRoutes.js';
import newsletterRoutes from './newsletterRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';
import { getContestDates } from '../utils/contestConfig.js';
import Code from '../models/Ticket.js';

const router = express.Router();

// Routes API
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/admin', adminRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/telemetry', telemetryRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Thé Tip Top opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Informations sur le concours (dates définies par l'admin dans /admin)
router.get('/contest-info', async (req, res, next) => {
  try {
    const { contest_start_date, contest_end_date, claim_end_date } = await getContestDates();
    const now = new Date();

    let status = 'upcoming';
    if (now >= contest_start_date && now <= contest_end_date) {
      status = 'active';
    } else if (now > contest_end_date && now <= claim_end_date) {
      status = 'claiming';
    } else if (now > claim_end_date) {
      status = 'ended';
    }

    // Tickets déjà validés (codes joués / lots attribués) — aligné sur les stats admin
    let validatedTicketsCount = 0;
    try {
      validatedTicketsCount = await Code.countDocuments({
        etat: { $in: ['utilise', 'reclame'] },
      });
    } catch (err) {
      console.error('contest-info validatedTicketsCount:', err);
    }

    res.status(200).json({
      success: true,
      data: {
        status,
        dates: {
          start: contest_start_date,
          end: contest_end_date,
          claimEnd: claim_end_date,
        },
        maxTickets: parseInt(process.env.MAX_TICKETS) || 500000,
        validatedTicketsCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
