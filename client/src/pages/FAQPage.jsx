import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import Card from '../components/common/Card';

const faqItems = [
  { q: 'Comment participer au jeu-concours ?', a: 'Effectuez un achat de 49€ minimum dans une boutique Thé Tip Top ou en ligne, récupérez votre code à 10 caractères sur votre ticket de caisse, puis saisissez-le sur notre site dans la section "Jouer".' },
  { q: 'Tous les tickets sont-ils gagnants ?', a: 'Oui ! 100% des 500 000 tickets mis en jeu sont gagnants. Vous remporterez l\'un de nos 5 lots : infuseur à thé, thé détox 100g, thé signature 100g, coffret découverte 39€ ou coffret prestige 69€.' },
  { q: 'Où trouver mon code ?', a: 'Votre code unique à 10 caractères se trouve en bas de votre ticket de caisse (achat en boutique) ou sur votre facture (achat en ligne).' },
  { q: 'Combien de fois puis-je participer ?', a: 'Vous pouvez participer autant de fois que vous le souhaitez, à condition d\'avoir un nouveau ticket de caisse avec un code valide pour chaque participation. Un code ne peut être utilisé qu\'une seule fois.' },
  { q: 'Comment récupérer mon lot ?', a: 'Rendez-vous dans l\'une de nos boutiques Thé Tip Top avec votre code et une pièce d\'identité. Vous pouvez également opter pour un envoi postal (délai de 2-3 semaines).' },
  { q: 'Jusqu\'à quand puis-je réclamer mon lot ?', a: 'Vous avez jusqu\'au 29 avril 2026 pour réclamer votre lot, soit 30 jours après la fin du concours.' },
  { q: 'Qu\'est-ce que le gros lot final ?', a: 'Un tirage au sort sera effectué le 30 avril 2026 parmi tous les participants pour désigner le gagnant de 1 an de thé d\'une valeur de 360€. Chaque participation compte pour une chance au tirage.' },
  { q: 'Qui supervise le tirage au sort ?', a: 'Le tirage au sort est supervisé par Maître Arnaud Rick, huissier de justice, conformément au règlement déposé.' },
  { q: 'Puis-je participer si je ne réside pas en France ?', a: 'Le jeu-concours est réservé aux personnes majeures résidant en France métropolitaine.' },
  { q: 'Comment mes données personnelles sont-elles protégées ?', a: 'Vos données sont traitées conformément au RGPD. Elles ne sont utilisées que pour la gestion du concours et, si vous y consentez, pour des communications marketing. Vous pouvez exercer vos droits à tout moment via votre profil ou en contactant dpo@thetiptop.fr.' },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="min-h-screen pt-24 pb-16">
      <section className="bg-gradient-to-br from-matcha-600 to-matcha-800 py-16 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <div className="container-wide relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6"><HelpCircle className="w-4 h-4" /> Questions fréquentes</span>
            <h1 className="text-4xl font-display font-bold mb-4">FAQ</h1>
            <p className="text-cream-200 text-lg">Trouvez les réponses à vos questions sur le jeu-concours.</p>
          </motion.div>
        </div>
      </section>
      <section className="section bg-cream-50" aria-labelledby="faq-liste-heading">
        <div className="container-wide max-w-3xl">
          <h2 id="faq-liste-heading" className="sr-only">
            Liste des questions fréquentes sur le jeu-concours Thé Tip Top
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                <Card className="cursor-pointer" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-display font-semibold text-tea-900">{item.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-tea-500 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-tea-600 mt-4 pt-4 border-t border-cream-200 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12">
            <Card className="bg-matcha-50 border border-matcha-200 text-center">
              <MessageCircle className="w-10 h-10 text-matcha-600 mx-auto mb-4" />
              <h2 className="font-display font-semibold text-tea-900 mb-2">Vous n&apos;avez pas trouvé votre réponse ?</h2>
              <p className="text-tea-600">Contactez-nous à <a href="mailto:concours@thetiptop.fr" className="text-matcha-600 hover:underline font-medium">concours@thetiptop.fr</a></p>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
