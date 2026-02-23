import express from 'express';
import { body } from 'express-validator';
import {
  validateTicket,
  getMyParticipations,
  getTicketByCode,
  claimPrize,
  getCustomerPrizes,
  searchCustomers,
  getPrizes,
  checkTicket,
} from '../controllers/ticketController.js';
import { protect, employeeOrAdmin } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';

const router = express.Router();

// Routes publiques
router.get('/prizes', getPrizes);
router.get('/check/:code', checkTicket);

// Routes protégées (utilisateurs connectés)
router.use(protect);

// Validation et participation
router.post(
  '/validate',
  validate([
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Le code est requis')
      .isLength({ min: 10, max: 10 })
      .withMessage('Le code doit contenir 10 caractères'),
  ]),
  validateTicket
);

// Historique des participations
router.get('/my-participations', getMyParticipations);

// Routes employés/admin
router.get('/customers/search', employeeOrAdmin, searchCustomers);
router.get('/code/:code', employeeOrAdmin, getTicketByCode);
router.put('/:code/claim', employeeOrAdmin, claimPrize);
router.get('/customer/:email', employeeOrAdmin, getCustomerPrizes);

export default router;
