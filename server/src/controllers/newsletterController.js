import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendNewsletterWelcome, isSendGridEnabled } from '../services/sendgridService.js';

/**
 * Inscription à la newsletter (public).
 * POST /api/newsletter/subscribe
 * Body: { email, consent? }
 * Envoie un email de bienvenue via SendGrid si configuré.
 */
export const subscribe = async (req, res, next) => {
  try {
    const { email, consent = true } = req.body;

    if (!email || typeof email !== 'string') {
      return next(new AppError("L'email est requis.", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return next(new AppError("Format d'email invalide.", 400));
    }

    const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter. À bientôt dans votre boîte mail !",
      });
    }

    await NewsletterSubscriber.create({
      email: normalizedEmail,
      consent: !!consent,
      source: req.body.source || 'footer',
    });

    if (isSendGridEnabled()) {
      sendNewsletterWelcome(normalizedEmail).catch((err) => {
        console.error('[Newsletter] Échec envoi email bienvenue:', err.response?.body || err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: "Merci ! Vous êtes inscrit à la newsletter Thé Tip Top. Vous recevrez nos actualités et les infos du jeu-concours.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter.",
      });
    }
    next(error);
  }
};
