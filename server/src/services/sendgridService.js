import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@thetiptop.fr';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Thé Tip Top';

let isConfigured = false;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  isConfigured = true;
}

/**
 * Vérifie si SendGrid est configuré (clé API présente).
 */
export function isSendGridEnabled() {
  return !!SENDGRID_API_KEY && isConfigured;
}

/**
 * Envoi générique via SendGrid.
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise<[Response, {}]>}
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!isSendGridEnabled()) {
    throw new Error('SendGrid non configuré : SENDGRID_API_KEY manquante.');
  }
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text: text || (html && html.replace(/<[^>]+>/g, ' ')) || '',
    html: html || text,
  };
  return sgMail.send(msg);
}

/**
 * Email de bienvenue après inscription à la newsletter.
 * @param {string} email - Adresse du destinataire
 */
export async function sendNewsletterWelcome(email) {
  const subject = 'Bienvenue dans la newsletter Thé Tip Top 🍵';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Newsletter Thé Tip Top</title></head>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #2d5a3d;">Bienvenue dans la newsletter Thé Tip Top</h1>
  <p>Merci de vous être inscrit à notre newsletter.</p>
  <p>Vous recevrez nos actualités, les infos sur le <strong>jeu-concours 100% gagnant</strong> et les lots à gagner.</p>
  <p>À très bientôt,<br><strong>L'équipe Thé Tip Top</strong></p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="font-size: 12px; color: #888;">Vous recevez ce message car vous vous êtes inscrit sur thetiptop-jeu.fr. Projet étudiant fictif.</p>
</body>
</html>`;
  const text = `Bienvenue dans la newsletter Thé Tip Top. Vous recevrez nos actualités et les infos du jeu-concours. À bientôt, l'équipe Thé Tip Top.`;
  return sendEmail({ to: email, subject, text, html });
}
