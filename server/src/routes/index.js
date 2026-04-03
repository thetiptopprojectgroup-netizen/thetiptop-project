import express from 'express';
import authRoutes from './authRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Routes API
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/admin', adminRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Thé Tip Top opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Informations sur le concours
router.get('/contest-info', (req, res) => {
  const now = new Date();
  const contestStart = new Date(process.env.CONTEST_START_DATE || '2026-03-01');
  const contestEnd = new Date(process.env.CONTEST_END_DATE || '2026-03-30');
  const claimEnd = new Date(process.env.CLAIM_END_DATE || '2026-04-29');

  let status = 'upcoming';
  if (now >= contestStart && now <= contestEnd) {
    status = 'active';
  } else if (now > contestEnd && now <= claimEnd) {
    status = 'claiming';
  } else if (now > claimEnd) {
    status = 'ended';
  }

  res.status(200).json({
    success: true,
    data: {
      status,
      dates: {
        start: contestStart,
        end: contestEnd,
        claimEnd: claimEnd,
      },
      maxTickets: parseInt(process.env.MAX_TICKETS) || 500000,
    },
  });
});

export default router;
