/**
 * Lots du jeu-concours : images dans client/public/images/prizes/
 * (remplacer les PNG si besoin — noms de fichiers stables).
 */
export const prizesDisplay = [
  {
    id: 'infuseur',
    name: 'Infuseur à thé',
    descriptionShort: 'Élégant infuseur en acier inoxydable',
    descriptionLong:
      'Un infuseur à thé élégant en acier inoxydable, parfait pour déguster nos thés en feuilles.',
    image: '/images/prizes/infuseur.png',
    probability: '60%',
    value: '10€',
    color: 'from-matcha-400 to-matcha-600',
    icon: '🍵',
  },
  {
    id: 'the_detox',
    name: 'Thé détox 100g',
    descriptionShort: 'Thé bio détox ou infusion',
    descriptionLong:
      'Une boîte de 100g de thé détox bio ou infusion aux herbes, sélectionné par nos experts.',
    image: '/images/prizes/the-detox.png',
    probability: '20%',
    value: '15€',
    color: 'from-emerald-400 to-emerald-600',
    icon: '🌿',
  },
  {
    id: 'the_signature',
    name: 'Thé signature 100g',
    descriptionShort: 'Notre mélange signature exclusif',
    descriptionLong:
      "Notre mélange signature exclusif, créé spécialement pour l'anniversaire de Thé Tip Top.",
    image: '/images/prizes/the-signature.png',
    probability: '10%',
    value: '25€',
    color: 'from-gold-400 to-gold-600',
    icon: '✨',
  },
  {
    id: 'coffret_decouverte',
    name: 'Coffret découverte',
    descriptionShort: 'Assortiment premium 39€',
    descriptionLong: 'Un assortiment premium de nos meilleurs thés, dans un coffret élégant.',
    image: '/images/prizes/coffret-decouverte.png',
    probability: '6%',
    value: '39€',
    color: 'from-amber-400 to-amber-600',
    icon: '🎁',
  },
  {
    id: 'coffret_prestige',
    name: 'Coffret prestige',
    descriptionShort: 'Collection prestige 69€',
    descriptionLong: 'Notre collection prestige : thés rares, accessoires et surprises dans un écrin luxueux.',
    image: '/images/prizes/coffret-prestige.png',
    probability: '4%',
    value: '69€',
    color: 'from-rose-400 to-rose-600',
    icon: '👑',
  },
];
