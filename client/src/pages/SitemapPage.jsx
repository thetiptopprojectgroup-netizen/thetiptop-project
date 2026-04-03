import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Home, Gift, FileText, User } from 'lucide-react';
import Card from '../components/common/Card';

const sections = [
  {
    title: 'Accueil',
    icon: Home,
    links: [{ label: 'Accueil', href: '/' }],
  },
  {
    title: 'Le jeu-concours',
    icon: Gift,
    links: [
      { label: 'Comment jouer', href: '/how-it-works' },
      { label: 'Les lots à gagner', href: '/prizes' },
      { label: 'Règlement du jeu', href: '/rules' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Espace personnel',
    icon: User,
    description: 'Réservé aux utilisateurs connectés',
    links: [
      { label: 'Jouer', href: '/play' },
      { label: 'Mes gains', href: '/dashboard' },
      { label: 'Mon profil', href: '/profile' },
    ],
  },
  {
    title: 'Connexion',
    icon: User,
    links: [
      { label: 'Connexion', href: '/login' },
      { label: 'Inscription', href: '/register' },
      { label: 'Mot de passe oublié', href: '/forgot-password' },
    ],
  },
  {
    title: 'Informations légales',
    icon: FileText,
    links: [
      { label: 'Mentions légales', href: '/legal' },
      { label: 'CGU', href: '/terms' },
      { label: 'Politique de confidentialité', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen pt-32 pb-16 bg-cream-50">
      <div className="container-wide max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-matcha-100 flex items-center justify-center">
              <Map className="w-6 h-6 text-matcha-600" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-tea-900">Plan du site</h1>
              <p className="text-tea-600 mt-1">Retrouvez toutes les pages du site Thé Tip Top.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-tea-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-tea-600" />
                      </div>
                      <h2 className="text-xl font-display font-semibold text-tea-900">
                        {section.title}
                      </h2>
                    </div>
                    {section.description && (
                      <p className="text-sm text-tea-500 mb-3">{section.description}</p>
                    )}
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className="text-tea-700 hover:text-matcha-600 hover:underline transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 text-center"
          >
            <Link
              to="/"
              className="text-matcha-600 hover:text-matcha-700 font-medium hover:underline"
            >
              ← Retour à l'accueil
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
