import express from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletterController.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

export default router;
