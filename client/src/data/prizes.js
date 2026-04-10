/**
 * Lots du jeu — ordre d’affichage (images 1 → 5) :
 * 1 Coffret prestige · 2 Coffret découverte · 3 Thé signature · 4 Thé détox · 5 Infuseur
 */
export const PRIZES = [
  {
    id: 'coffret_prestige',
    name: 'Coffret prestige',
    description: 'Collection prestige 69€',
    image: '/images/prizes/coffret-prestige.png',
    icon: '👑',
    probability: '4%',
    value: '69€',
    color: 'from-rose-400 to-rose-600',
    detail:
      'Notre collection prestige : thés rares, accessoires et surprises dans un écrin luxueux.',
  },
  {
    id: 'coffret_decouverte',
    name: 'Coffret découverte',
    description: 'Assortiment premium 39€',
    image: '/images/prizes/coffret-decouverte.png',
    icon: '🎁',
    probability: '6%',
    value: '39€',
    color: 'from-amber-400 to-amber-600',
    detail: 'Un assortiment premium de nos meilleurs thés, dans un coffret élégant.',
  },
  {
    id: 'the_signature',
    name: 'Thé signature 100g',
    description: 'Notre mélange signature exclusif',
    image: '/images/prizes/the-signature.png',
    icon: '✨',
    probability: '10%',
    value: '25€',
    color: 'from-gold-400 to-gold-600',
    detail:
      "Notre mélange signature exclusif, créé spécialement pour l'anniversaire de Thé Tip Top.",
  },
  {
    id: 'the_detox',
    name: 'Thé détox 100g',
    description: 'Thé bio détox ou infusion',
    image: '/images/prizes/the-detox.png',
    icon: '🌿',
    probability: '20%',
    value: '15€',
    color: 'from-emerald-400 to-emerald-600',
    detail:
      'Une boîte de 100g de thé détox bio ou infusion aux herbes, sélectionné par nos experts.',
  },
  {
    id: 'infuseur',
    name: 'Infuseur à thé',
    description: 'Élégant infuseur en acier inoxydable',
    image: '/images/prizes/infuseur.png',
    icon: '🍵',
    probability: '60%',
    value: '10€',
    color: 'from-matcha-400 to-matcha-600',
    detail:
      'Un infuseur à thé élégant en acier inoxydable, parfait pour déguster nos thés en feuilles.',
  },
];
