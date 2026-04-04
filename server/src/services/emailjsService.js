/**
 * EmailJS — envoi via HTTP API (côté serveur).
 * @see https://www.emailjs.com/docs/rest-api/send/
 *
 * Créez un compte EmailJS, un service email (Gmail, Outlook…), puis des modèles
 * avec les variables utilisées ci-dessous (ex. {{user_email}}, {{unsubscribe_url}}).
 */

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';
const TEMPLATE_WELCOME = process.env.EMAILJS_TEMPLATE_NEWSLETTER_WELCOME || '';
const TEMPLATE_GOODBYE = process.env.EMAILJS_TEMPLATE_NEWSLETTER_GOODBYE || '';
const TEMPLATE_PRIZE_DELIVERED = process.env.EMAILJS_TEMPLATE_PRIZE_DELIVERED || '';
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send';

export function isEmailJsEnabled() {
  return !!(SERVICE_ID && PUBLIC_KEY && TEMPLATE_WELCOME);
}

/**
 * @param {string} templateId
 * @param {Record<string, string>} templateParams — variables disponibles dans le modèle EmailJS
 */
async function sendTemplate(templateId, templateParams) {
  if (!SERVICE_ID || !PUBLIC_KEY || !templateId) {
    throw new Error('EmailJS : EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY et le template sont requis.');
  }

  const body = {
    service_id: SERVICE_ID,
    template_id: templateId,
    user_id: PUBLIC_KEY,
    template_params: templateParams,
  };

  if (PRIVATE_KEY) {
    body.accessToken = PRIVATE_KEY;
  }

  const res = await fetch(EMAILJS_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`EmailJS ${res.status}: ${errText}`);
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    return { ok: true, raw: text };
  }
}

/**
 * Email de bienvenue newsletter.
 * Modèle conseillé : variables {{user_email}}, {{unsubscribe_url}} (lien désinscription).
 */
export async function sendNewsletterWelcome(email) {
  const unsubscribeUrl = `${CLIENT_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
  // Plusieurs alias : le champ « To Email » du modèle EmailJS doit reprendre l’un d’eux (ex. {{to_email}}).
  return sendTemplate(TEMPLATE_WELCOME, {
    user_email: email,
    to_email: email,
    email,
    to: email,
    recipient: email,
    unsubscribe_url: unsubscribeUrl,
  });
}

/**
 * Confirmation de désinscription.
 * Modèle conseillé : variable {{user_email}}.
 */
export async function sendNewsletterGoodbye(email) {
  if (!TEMPLATE_GOODBYE) {
    return;
  }
  return sendTemplate(TEMPLATE_GOODBYE, {
    user_email: email,
    to_email: email,
    email,
    to: email,
    recipient: email,
  });
}

export function isPrizeDeliveredEmailConfigured() {
  return !!(SERVICE_ID && PUBLIC_KEY && TEMPLATE_PRIZE_DELIVERED);
}

/**
 * Attestation de remise physique du lot (PUT /api/tickets/:code/claim).
 * Modèle EmailJS : champ « To Email » = {{to_email}} ; variables {{prize_name}}, {{ticket_code}}, etc.
 */
export async function sendPrizeDeliveredEmail({
  email,
  firstName = '',
  lastName = '',
  prizeName,
  prizeDescription = '',
  ticketCode,
  storeLocation = '',
}) {
  const dateRemise = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const recipientName = [firstName, lastName].filter(Boolean).join(' ') || 'Joueur';

  return sendTemplate(TEMPLATE_PRIZE_DELIVERED, {
    user_email: email,
    to_email: email,
    email,
    to: email,
    recipient: email,
    recipient_name: recipientName,
    first_name: firstName,
    last_name: lastName,
    prize_name: prizeName,
    prize_description: prizeDescription,
    ticket_code: ticketCode,
    store_location: storeLocation,
    boutique_location: storeLocation,
    date_remise: dateRemise,
    site_url: CLIENT_URL,
  });
}
