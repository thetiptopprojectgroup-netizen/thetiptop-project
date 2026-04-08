import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  sendNewsletterWelcome,
  sendNewsletterGoodbye,
  isEmailJsEnabled,
} from '../services/emailjsService.js';
import { recordNewsletterAction } from '../monitoring/metrics.js';

/**
 * Inscription à la newsletter (public).
 * POST /api/newsletter/subscribe
 * Body: { email, consent?, source? }
 */
export const subscribe = async (req, res, next) => {
  try {
    const { email, consent = true, source = 'footer' } = req.body;

    if (!email || typeof email !== 'string') {
      recordNewsletterAction('subscribe', 'failure');
      return next(new AppError("L'email est requis.", 400));
    }

    if (!consent) {
      recordNewsletterAction('subscribe', 'failure');
      return next(
        new AppError('Le consentement est requis pour recevoir la newsletter (RGPD).', 400)
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      recordNewsletterAction('subscribe', 'failure');
      return next(new AppError("Format d'email invalide.", 400));
    }

    const allowedSources = ['footer', 'home', 'modal'];
    const src = allowedSources.includes(source) ? source : 'footer';

    const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });
    if (existing) {
      recordNewsletterAction('subscribe', 'already_exists');
      return res.status(200).json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter. À bientôt dans votre boîte mail !",
      });
    }

    await NewsletterSubscriber.create({
      email: normalizedEmail,
      consent: true,
      source: src,
    });

    if (isEmailJsEnabled()) {
      sendNewsletterWelcome(normalizedEmail).catch((err) => {
        console.error('[Newsletter] Échec EmailJS bienvenue:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Merci ! Vous êtes inscrit à la newsletter Thé Tip Top. Vérifiez votre boîte mail (y compris les courriers indésirables).",
    });
    recordNewsletterAction('subscribe', 'success');
  } catch (error) {
    if (error.code === 11000) {
      recordNewsletterAction('subscribe', 'already_exists');
      return res.status(200).json({
        success: true,
        message: "Vous êtes déjà inscrit à notre newsletter.",
      });
    }
    recordNewsletterAction('subscribe', 'error');
    next(error);
  }
};

/**
 * Désinscription (public).
 * POST /api/newsletter/unsubscribe
 * Body: { email }
 */
export const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      recordNewsletterAction('unsubscribe', 'failure');
      return next(new AppError("L'email est requis.", 400));
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      recordNewsletterAction('unsubscribe', 'failure');
      return next(new AppError("Format d'email invalide.", 400));
    }

    const removed = await NewsletterSubscriber.findOneAndDelete({ email: normalizedEmail });
    if (!removed) {
      recordNewsletterAction('unsubscribe', 'not_found');
      return res.status(200).json({
        success: true,
        message: 'Cette adresse ne figurait pas dans notre liste ou a déjà été retirée.',
      });
    }

    if (isEmailJsEnabled()) {
      sendNewsletterGoodbye(normalizedEmail).catch((err) => {
        console.error('[Newsletter] Échec EmailJS au revoir:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vous êtes désinscrit. Nous ne vous enverrons plus d’emails newsletter.',
    });
    recordNewsletterAction('unsubscribe', 'success');
  } catch (error) {
    recordNewsletterAction('unsubscribe', 'error');
    next(error);
  }
};
