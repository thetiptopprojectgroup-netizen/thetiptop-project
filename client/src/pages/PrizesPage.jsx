import { motion } from 'framer-motion';
import { Gift, Trophy, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PRIZES } from '../data/prizes';

export default function PrizesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <section className="bg-gradient-to-br from-matcha-600 to-matcha-800 py-20 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <div className="container-wide relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <Gift className="w-4 h-4" /> 100% des tickets gagnants
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Les lots à gagner</h1>
            <p className="text-cream-200 text-lg max-w-2xl mx-auto">Découvrez les 5 lots exceptionnels que vous pouvez remporter.</p>
          </motion.div>
        </div>
      </section>

      <section className="section bg-cream-50" aria-labelledby="lots-detail-heading">
        <div className="container-wide">
          <h2 id="lots-detail-heading" className="mb-10 text-center text-2xl font-display font-bold text-tea-900 md:text-3xl">
            Détail des lots à gagner
          </h2>
          <div className="space-y-8">
            {PRIZES.map((prize, index) => (
              <motion.div key={prize.id} initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card hover className="overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div
                      className={`flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-2 shadow-lg md:h-44 md:w-44 ${prize.color}`}
                    >
                      <img
                        src={prize.image}
                        alt={prize.name}
                        className="max-h-full max-w-full object-contain"
                        width={176}
                        height={176}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-display font-bold text-tea-900 mb-2">{prize.name}</h3>
                      <p className="text-tea-700 font-medium mb-2">{prize.description}</p>
                      <p className="text-tea-600 mb-4 leading-relaxed">{prize.detail}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="badge badge-success flex items-center gap-1"><Star className="w-3 h-3" /> Probabilité : {prize.probability}</span>
                        <span className="badge badge-warning flex items-center gap-1"><Sparkles className="w-3 h-3" /> Valeur : {prize.value}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
            <Card className="bg-gradient-to-r from-gold-50 to-gold-100 border-2 border-gold-300">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold-500 mb-6 shadow-gold">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-display font-bold text-tea-900 mb-2">Gros lot final</h2>
                <p className="text-xl text-gold-700 font-medium mb-2">1 an de thé d'une valeur de 360€</p>
                <p className="text-tea-600 max-w-xl mx-auto mb-8">Tirage au sort parmi tous les participants, supervisé par Maître Arnaud Rick, huissier de justice.</p>
                <Link to="/register"><Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>Participer maintenant</Button></Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
