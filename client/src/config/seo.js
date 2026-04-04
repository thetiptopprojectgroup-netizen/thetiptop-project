/**
 * SEO : titres et descriptions par route (Google utilise surtout title + meta description).
 * URL canonique / Open Graph : VITE_SITE_URL en prod (voir .env.example).
 */
export const SITE_NAME = 'Thé Tip Top';

/** URL publique du site (sans slash final) — alignée sur le déploiement / Search Console */
export function getSiteUrl() {
  const v = import.meta.env.VITE_SITE_URL;
  if (v && typeof v === 'string') return v.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://dsp5-archi-o22a-15m-g3.fr';
}

/** Phrases naturelles (éviter le bourrage de mots-clés — Google privilégie la qualité du texte) */
const BASE_DESC =
  'Thé Tip Top : jeu-concours 100% gagnant sur le thé, infusions et lots premium. Participez en ligne, ' +
  'code sur ticket, cadeaux bio et infusion. Concours Thé Tip Top, Nice et France.';

const ROUTES = {
  '/': {
    title: 'Thé Tip Top | Jeu-concours thé 100% gagnant — concours infusion & lots',
    description: `${BASE_DESC} Inscription gratuite, règlement du jeu, lots infuseur, coffrets thé.`,
    keywords:
      'jeu concours thé, concours thé, Thé Tip Top, thetiptop, jeu concours infusion, concours bio, ' +
      'thé Nice, lots thé, cadeau thé, infusion, jeu 100% gagnant, grand tirage au sort',
  },
  '/prizes': {
    title: 'Lots & cadeaux | Jeu-concours Thé Tip Top — infuseur, coffrets thé',
    description:
      'Découvrez tous les lots du jeu-concours Thé Tip Top : infuseur, thés détox et signature, coffrets 39€ et 69€, gros lot 360€.',
    keywords:
      'lots jeu concours thé, cadeaux thé, coffret thé, infuseur thé, Thé Tip Top lots',
  },
  '/how-it-works': {
    title: 'Comment participer | Jeu-concours Thé Tip Top — règles & étapes',
    description:
      'Comment jouer au jeu-concours Thé Tip Top : achat 49€, code ticket 10 caractères, validation en ligne, réclamation du lot en boutique.',
    keywords:
      'comment participer jeu concours thé, règles Thé Tip Top, code ticket, jeu concours étapes',
  },
  '/rules': {
    title: 'Règlement du jeu-concours | Thé Tip Top',
    description:
      'Règlement officiel du jeu-concours Thé Tip Top : durée, modalités, lots, réclamation, données personnelles.',
    keywords: 'règlement jeu concours thé, règles Thé Tip Top, conditions concours',
  },
  '/faq': {
    title: 'FAQ | Jeu-concours Thé Tip Top — questions fréquentes',
    description:
      'Questions fréquentes sur le jeu-concours Thé Tip Top : participation, codes, lots, réclamation, Nice.',
    keywords: 'FAQ jeu concours thé, questions Thé Tip Top, aide concours',
  },
  '/legal': {
    title: 'Mentions légales | Thé Tip Top',
    description: 'Mentions légales du site Thé Tip Top et du jeu-concours.',
    keywords: 'mentions légales Thé Tip Top',
  },
  '/terms': {
    title: 'Conditions générales | Thé Tip Top',
    description: 'Conditions générales d’utilisation et de participation au jeu-concours Thé Tip Top.',
    keywords: 'CGU Thé Tip Top, conditions jeu concours',
  },
  '/privacy': {
    title: 'Politique de confidentialité | Thé Tip Top',
    description:
      'Politique de confidentialité et protection des données personnelles — jeu-concours Thé Tip Top.',
    keywords: 'confidentialité Thé Tip Top, RGPD jeu concours',
  },
  '/login': {
    title: 'Connexion | Thé Tip Top — espace joueur jeu-concours',
    description: 'Connectez-vous à votre compte Thé Tip Top pour jouer et suivre vos gains du jeu-concours.',
    keywords: 'connexion Thé Tip Top, compte jeu concours thé',
  },
  '/register': {
    title: 'Inscription | Jeu-concours Thé Tip Top — créer un compte',
    description:
      'Créez votre compte pour participer au jeu-concours Thé Tip Top : thés, infusions et lots à gagner.',
    keywords: 'inscription jeu concours thé, compte Thé Tip Top, participer concours',
  },
  '/forgot-password': {
    title: 'Mot de passe oublié | Thé Tip Top',
    description: 'Réinitialisez votre mot de passe pour accéder à votre espace joueur Thé Tip Top.',
    keywords: 'mot de passe oublié Thé Tip Top',
  },
  '/reset-password': {
    title: 'Nouveau mot de passe | Thé Tip Top',
    description: 'Définissez un nouveau mot de passe pour votre compte Thé Tip Top.',
    keywords: 'réinitialisation mot de passe Thé Tip Top',
  },
};

/**
 * @param {string} pathname
 * @returns {{ title: string, description: string, keywords: string }}
 */
export function getSeoForPath(pathname) {
  if (pathname.startsWith('/reset-password')) {
    return ROUTES['/reset-password'];
  }
  return ROUTES[pathname] || ROUTES['/'];
}
