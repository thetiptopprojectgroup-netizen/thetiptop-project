import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gift, Star, Trophy, ShoppingCart, Ticket, PartyPopper, ArrowRight, CheckCircle, Clock, Store } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const steps = [
  { icon: <ShoppingCart className="w-8 h-8" />, title: 'Faites un achat de 49€ minimum', description: 'Rendez-vous dans l\'une de nos boutiques Thé Tip Top ou sur notre site internet et effectuez un achat d\'un montant minimum de 49€.', detail: 'Valable dans les 10 boutiques Thé Tip Top en France et sur notre e-shop.' },
  { icon: <Ticket className="w-8 h-8" />, title: 'Récupérez votre code unique', description: 'Un code unique à 10 caractères alphanumériques est imprimé en bas de votre ticket de caisse ou de votre facture.', detail: 'Exemple de code : ABC123XYZ9' },
  { icon: <Star className="w-8 h-8" />, title: 'Saisissez votre code en ligne', description: 'Connectez-vous sur notre site, rendez-vous dans la section "Jouer" et entrez votre code à 10 caractères.', detail: 'Un compte gratuit est nécessaire pour participer.' },
  { icon: <PartyPopper className="w-8 h-8" />, title: 'Découvrez votre lot !', description: '100% des tickets sont gagnants ! Découvrez immédiatement quel lot vous avez remporté parmi nos 5 catégories de prix.', detail: 'De l\'infuseur à thé (10€) au coffret prestige (69€).' },
  { icon: <Store className="w-8 h-8" />, title: 'Récupérez votre lot', description: 'Rendez-vous en boutique avec votre code et une pièce d\'identité pour récupérer votre lot. Ou attendez l\'envoi postal.', detail: 'Vous avez 30 jours après la fin du concours pour réclamer votre lot.' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <section className="bg-gradient-to-br from-tea-900 to-tea-950 py-20 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-5" />
        <div className="container-wide relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <CheckCircle className="w-4 h-4" /> Simple et rapide
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Comment participer ?</h1>
            <p className="text-cream-200 text-lg max-w-2xl mx-auto">5 étapes simples pour tenter votre chance et remporter des lots exceptionnels.</p>
          </motion.div>
        </div>
      </section>

      <section className="section bg-cream-50">
        <div className="container-wide max-w-4xl">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-matcha-500 to-matcha-700 flex items-center justify-center text-white relative">
                        {step.icon}
                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center text-sm font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-tea-900 mb-2">{step.title}</h3>
                      <p className="text-tea-600 mb-3">{step.description}</p>
                      <p className="text-sm text-matcha-600 bg-matcha-50 px-4 py-2 rounded-lg inline-block">{step.detail}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
            <Card className="bg-gradient-to-r from-gold-50 to-gold-100 border-2 border-gold-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-display font-bold text-tea-900 mb-1">Bonus : Tirage au sort final</h3>
                  <p className="text-tea-600">Tous les participants sont automatiquement inscrits au tirage au sort pour le gros lot : 1 an de thé d'une valeur de 360€ !</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="mt-12 text-center">
            <Link to="/register"><Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>Participer maintenant</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
