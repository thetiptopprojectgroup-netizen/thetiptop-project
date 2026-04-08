import express from 'express';
import { trackEvent, trackPlayButton } from '../controllers/telemetryController.js';

const router = express.Router();

router.post('/play-button', trackPlayButton);
router.post('/event', trackEvent);

export default router;
