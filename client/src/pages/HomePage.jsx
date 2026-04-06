import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Leaf, Star, Trophy, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const prizes = [
  { icon: '🍵', name: 'Infuseur à thé', description: 'Élégant infuseur en acier inoxydable', probability: '60%', value: '10€' },
  { icon: '🌿', name: 'Thé détox 100g', description: 'Thé bio détox ou infusion', probability: '20%', value: '15€' },
  { icon: '✨', name: 'Thé signature 100g', description: 'Notre mélange signature exclusif', probability: '10%', value: '25€' },
  { icon: '🎁', name: 'Coffret découverte', description: 'Assortiment premium 39€', probability: '6%', value: '39€' },
  { icon: '👑', name: 'Coffret prestige', description: 'Collection prestige 69€', probability: '4%', value: '69€' },
];

const steps = [
  { icon: <Gift className="w-6 h-6" />, title: 'Achetez pour 49€', description: 'Faites un achat de 49€ ou plus en boutique ou en ligne' },
  { icon: <Star className="w-6 h-6" />, title: 'Récupérez votre code', description: 'Un code unique à 10 caractères se trouve sur votre ticket' },
  { icon: <Trophy className="w-6 h-6" />, title: 'Validez et gagnez !', description: '100% des tickets sont gagnants. Réclamez votre lot !' },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-matcha-700 via-matcha-600 to-matcha-800 overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <div className="absolute top-20 left-10 w-20 h-20 bg-gold-400/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-matcha-400/20 rounded-full blur-xl animate-float animate-delay-300" />

        <div className="container-wide relative z-10 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-cream-100 text-sm mb-6">
                <Sparkles className="w-4 h-4 text-gold-400" />
                Grand jeu-concours thé — Thé Tip Top
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
                100% des tickets<br />sont{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">gagnants</span>
              </h1>
              
              <p className="text-xl text-cream-200 mb-8 max-w-lg leading-relaxed">
                Célébrez l'ouverture de notre 10ème boutique à Nice ! 
                Participez et remportez des lots exceptionnels parmi nos thés d'exception.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/register">
                  <Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Participer maintenant
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                    Comment ça marche ?
                  </Button>
                </Link>
              </div>

              <div className="flex gap-8">
                <div><div className="text-3xl font-display font-bold text-white">500K</div><div className="text-cream-300 text-sm">Tickets à gagner</div></div>
                <div><div className="text-3xl font-display font-bold text-white">30</div><div className="text-cream-300 text-sm">Jours de jeu</div></div>
                <div><div className="text-3xl font-display font-bold text-white">360€</div><div className="text-cream-300 text-sm">Gros lot final</div></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center">
                {/*
                  Ancienne illustration « tasse » en pur CSS (forme + liquide + vapeur animate-steam + anse + soucoupe).
                  Conservée en commentaire pour référence ; remplacée par heroanime.gif (boucle native du navigateur, sans fin).
                <div className="relative">
                  <div className="w-64 h-64 bg-gradient-to-br from-cream-100 to-cream-200 rounded-b-[50%] rounded-t-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-b from-gold-300/60 to-gold-500/80" />
                    <div className="absolute -top-8 left-1/4 w-2 h-16 bg-white/30 rounded-full animate-steam" />
                    <div className="absolute -top-10 left-1/2 w-2 h-20 bg-white/20 rounded-full animate-steam animate-delay-200" />
                  </div>
                  <div className="absolute right-0 top-1/4 w-8 h-20 border-4 border-cream-200 rounded-r-full translate-x-1/2" />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 h-8 bg-gradient-to-b from-cream-100 to-cream-300 rounded-full shadow-lg" />
                </div>
                */}
                <img
                  src="/images/imagesite/heroanime.gif"
                  alt="Animation thé — accessoires et coffret"
                  className="hero-heroanime relative z-0 w-full max-h-[min(28rem,70vh)] h-auto object-contain select-none pointer-events-none"
                  width={512}
                  height={512}
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute top-10 left-10 animate-float pointer-events-none"><Leaf className="w-12 h-12 text-matcha-300/40" /></div>
                <div className="absolute bottom-20 right-10 animate-float animate-delay-300 pointer-events-none"><Leaf className="w-8 h-8 text-gold-300/40" /></div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none"><path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0V120Z" fill="#fefdfb"/></svg>
        </div>
      </section>

      {/* Prizes Section */}
      <section className="section bg-cream-50">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 rounded-full text-gold-700 text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />Les lots à gagner
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-tea-900 mb-4">5 lots exceptionnels vous attendent</h2>
            <p className="text-tea-600 max-w-2xl mx-auto">Chaque ticket est gagnant ! Découvrez les lots que vous pouvez remporter.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {prizes.map((prize, index) => (
              <motion.div key={prize.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card hover className="h-full text-center">
                  <div className="text-5xl mb-4">{prize.icon}</div>
                  <h3 className="font-display font-semibold text-tea-900 mb-2">{prize.name}</h3>
                  <p className="text-sm text-tea-600 mb-4">{prize.description}</p>
                  <div className="flex justify-center gap-2">
                    <span className="badge badge-success">{prize.probability}</span>
                    <span className="badge badge-warning">{prize.value}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
            <Card className="inline-block bg-gradient-to-r from-gold-50 to-gold-100 border-2 border-gold-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center"><Trophy className="w-8 h-8 text-white" /></div>
                <div className="text-left">
                  <div className="text-sm text-gold-700 font-medium">Gros lot final</div>
                  <div className="text-xl font-display font-bold text-tea-900">1 an de thé (360€)</div>
                  <div className="text-sm text-tea-600">Tirage au sort parmi tous les participants</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-white">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-matcha-100 rounded-full text-matcha-700 text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />Simple et rapide
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-tea-900 mb-4">Comment participer ?</h2>
            <p className="text-tea-600 max-w-2xl mx-auto">Trois étapes simples pour tenter votre chance.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }} className="relative text-center">
                {index < steps.length - 1 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-cream-300" />}
                <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-matcha-500 to-matcha-700 text-white mb-6 shadow-tea">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-tea-900 mb-2">{step.title}</h3>
                <p className="text-tea-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-to-br from-tea-900 to-tea-950 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-5" />
        <div className="container-tight relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-cream-200 text-sm mb-6">
              <Clock className="w-4 h-4" />Offre limitée dans le temps
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Ne manquez pas cette opportunité unique !</h2>
            <p className="text-cream-300 text-lg mb-8 max-w-xl mx-auto">Le jeu-concours dure 30 jours. Plus de 500 000 tickets vous attendent.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"><Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>S'inscrire gratuitement</Button></Link>
              <Link to="/prizes"><Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 bg-transparent">Voir tous les lots</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
