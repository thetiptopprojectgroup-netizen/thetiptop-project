import express from 'express';
import { trackPlayButton } from '../controllers/telemetryController.js';

const router = express.Router();

router.post('/play-button', trackPlayButton);

export default router;
