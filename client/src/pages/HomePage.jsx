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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-matcha-800 via-matcha-600 to-emerald-800">
        <div className="absolute inset-0 leaf-pattern opacity-[0.12]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(219,150,69,0.35),transparent_55%)]" />
        <div className="absolute top-20 left-10 w-24 h-24 bg-gold-400/25 rounded-full blur-2xl animate-float" />
        <div className="absolute top-1/3 right-[8%] w-40 h-40 bg-amber-300/15 rounded-full blur-3xl animate-float animate-delay-200" />
        <div className="absolute bottom-40 right-20 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl animate-float animate-delay-300" />
        <div className="absolute bottom-24 left-[12%] w-28 h-28 bg-gold-300/20 rounded-full blur-xl animate-float" />

        <div className="container-wide relative z-10 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-cream-100 text-sm shadow-lg shadow-matcha-950/20">
                  <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                  Grand jeu-concours — Thé Tip Top
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-cream-50 border border-gold-400/40 bg-gold-500/15 backdrop-blur-sm shadow-md">
                  <Ticket className="w-4 h-4 text-gold-300 shrink-0" />
                  1 ticket = 1 lot à gagner
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.12] mb-6 drop-shadow-sm">
                100% des tickets<br />sont{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-300 to-amber-400">
                  gagnants
                </span>
              </h1>

              <p className="inline-flex items-center gap-2 text-gold-100/95 font-medium mb-4 text-sm md:text-base">
                <Zap className="w-4 h-4 text-gold-400 shrink-0" />
                Jouez en quelques clics — coffrets, thés premium & tirage 360€
              </p>

              <p className="text-lg md:text-xl text-cream-100/95 mb-8 max-w-lg leading-relaxed">
                Célébrez l&apos;ouverture de notre 10ème boutique à Nice : entrez votre code et découvrez immédiatement
                votre lot parmi nos thés d&apos;exception.
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
