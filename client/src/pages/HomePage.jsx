import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Leaf, Star, Trophy, Clock, CheckCircle, ArrowRight, Sparkles, Ticket, Zap } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { PRIZES } from '../data/prizes';

const steps = [
  { icon: <Gift className="w-6 h-6" />, title: 'Achetez pour 49€', description: 'Faites un achat de 49€ ou plus en boutique ou en ligne' },
  { icon: <Star className="w-6 h-6" />, title: 'Récupérez votre code', description: 'Un code unique à 10 caractères se trouve sur votre ticket' },
  { icon: <Trophy className="w-6 h-6" />, title: 'Validez et gagnez !', description: '100% des tickets sont gagnants. Réclamez votre lot !' },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* GIF background — loops natively */}
        <img
          src="/images/imagesite/Design sans titre (3).gif"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-matcha-950/90 via-matcha-900/75 to-matcha-950/50 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-matcha-950/80 via-transparent to-matcha-950/40" />

        <div className="container-wide relative z-10 pt-28 pb-24 md:pt-36 md:pb-28">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex flex-wrap gap-2 mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-md rounded-full text-cream-100 text-xs md:text-sm shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold-400 shrink-0" />
                  Grand jeu-concours Thé Tip Top
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-5 drop-shadow-lg">
                100% des tickets<br />sont{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-300 to-amber-400">
                  gagnants
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-cream-100/90 mb-7 max-w-lg leading-relaxed drop-shadow-md">
                Célébrez l&apos;ouverture de notre 10ème boutique à Nice !
                Participez et remportez des lots exceptionnels parmi nos thés d&apos;exception.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/register">
                  <Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Participer maintenant
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10 bg-transparent backdrop-blur-sm">
                    Comment ça marche ?
                  </Button>
                </Link>
              </div>

              <div className="flex gap-6 sm:gap-8">
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-md">500K</div>
                  <div className="text-cream-300/90 text-xs sm:text-sm">Tickets à gagner</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-md">30</div>
                  <div className="text-cream-300/90 text-xs sm:text-sm">Jours de jeu</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-md">360€</div>
                  <div className="text-cream-300/90 text-xs sm:text-sm">Gros lot final</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none"><path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0V120Z" fill="#fefdfb"/></svg>
        </div>
      </section>

      {/* Prizes Section */}
      <section className="section bg-cream-50/90 backdrop-blur-[2px] border-y border-gold-200/30 shadow-inner">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 rounded-full text-gold-700 text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />Les lots à gagner
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-tea-900 mb-4">
              5 lots exceptionnels vous attendent
            </h2>
            <p className="text-tea-600 max-w-2xl mx-auto text-balance">
              Chaque participation peut vous faire gagner un cadeau : de l&apos;infuseur au coffret prestige. Tentez votre
              chance !
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {PRIZES.map((prize, index) => (
              <motion.div key={prize.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <Card hover className="h-full text-center">
                  <div className="mb-4 mx-auto flex h-36 max-w-[11rem] items-center justify-center overflow-hidden rounded-xl bg-cream-100/80 p-2">
                    <img
                      src={prize.image}
                      alt={prize.name}
                      className="max-h-full w-full object-contain"
                      width={176}
                      height={144}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
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
      <section className="section bg-white/80 backdrop-blur-sm">
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
      <section className="section bg-gradient-to-br from-tea-900 via-matcha-950 to-tea-950 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(219,150,69,0.2),transparent_60%)]" />
        <div className="container-tight relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-cream-200 text-sm mb-6 border border-white/10">
              <Clock className="w-4 h-4" />
              Fenêtre limitée — ne laissez pas votre ticket dormir
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 text-balance">
              Prêt à gratter virtuellement votre lot ?
            </h2>
            <p className="text-cream-200 text-lg mb-8 max-w-xl mx-auto text-balance">
              30 jours de jeu, plus de 500 000 tickets : rejoignez des milliers de joueurs et révélez votre gain en
              direct.
            </p>
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
