/**
 * SEO par route (pur : testable sans import.meta / Vite).
 * Réutilisé par seo.js pour getSiteUrl + env.
 */

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
  '/newsletter/unsubscribe': {
    title: 'Désinscription newsletter | Thé Tip Top',
    description:
      'Retirez votre adresse email de la liste de diffusion Thé Tip Top. Votre compte jeu-concours reste inchangé.',
    keywords: '',
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
  if (pathname === '/newsletter/unsubscribe') {
    return ROUTES['/newsletter/unsubscribe'];
  }
  return ROUTES[pathname] || ROUTES['/'];
}

/** Pages à ne pas indexer (comptes, outils, désinscription). */
export function shouldNoIndexPath(pathname) {
  if (pathname === '/newsletter/unsubscribe') return true;
  if (pathname.startsWith('/reset-password')) return true;
  const prefixes = ['/admin', '/employee', '/play', '/dashboard', '/profile', '/oauth'];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
