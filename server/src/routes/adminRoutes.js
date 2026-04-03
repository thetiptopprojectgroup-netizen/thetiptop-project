import express from 'express';
import {
  getStats, getUsersForEmailing, exportEmails,
  drawGrandPrize, getGrandPrizeResult,
  getUsers, updateUserRole, toggleUserStatus, deleteUser,
  getBoutiques, createBoutique, updateBoutique, deleteBoutique,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getGameSession, getGameStats, getSampleTicketsByVariety,
  getContestConfig, updateContestConfig,
  getAdminCodes, getAdminCodeSamples,
} from '../controllers/adminController.js';
import { protect, adminOnly, employeeOrAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);

// Routes accessibles aux employés et admins
router.get('/game-stats', employeeOrAdmin, getGameStats);

// Routes admin uniquement
router.use(adminOnly);

// Configuration du concours
router.get('/contest-config', getContestConfig);
router.put('/contest-config', updateContestConfig);

// Statistiques
router.get('/stats', getStats);

// Codes / tickets générés (liste paginée + aperçu par type de lot)
router.get('/codes/samples', getAdminCodeSamples);
router.get('/codes', getAdminCodes);

// Utilisateurs
router.get('/users', getUsers);
router.get('/users/emailing', getUsersForEmailing);
router.get('/users/export', exportEmails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Tirage au sort
router.get('/grand-prize', getGrandPrizeResult);
router.post('/grand-prize/draw', drawGrandPrize);

// Boutiques
router.get('/boutiques', getBoutiques);
router.post('/boutiques', createBoutique);
router.put('/boutiques/:id', updateBoutique);
router.delete('/boutiques/:id', deleteBoutique);

// Employés boutique
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Session de jeu
router.get('/game-session', getGameSession);

// Aperçu : 2 tickets par variété (admin uniquement)
router.get('/sample-tickets', getSampleTicketsByVariety);

export default router;
