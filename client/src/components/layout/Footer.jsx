import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    concours: [
      { label: 'Comment jouer', href: '/how-it-works' },
      { label: 'Les lots à gagner', href: '/prizes' },
      { label: 'Règlement du jeu', href: '/rules' },
      { label: 'FAQ', href: '/faq' },
    ],
    legal: [
      { label: 'Mentions légales', href: '/legal' },
      { label: 'CGU', href: '/terms' },
      { label: 'Politique de confidentialité', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
    contact: [
      { icon: <Mail className="w-4 h-4" />, label: 'contact@thetiptop.fr', href: 'mailto:contact@thetiptop.fr' },
      { icon: <Phone className="w-4 h-4" />, label: '01 23 45 67 89', href: 'tel:+33123456789' },
      { icon: <MapPin className="w-4 h-4" />, label: '18 rue Léon Frot, 75011 Paris', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, href: 'https://facebook.com', label: 'Facebook' },
    { icon: <Instagram className="w-5 h-5" />, href: 'https://instagram.com', label: 'Instagram' },
    { icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com', label: 'Twitter' },
  ];

  return (
    <footer className="bg-tea-950 text-cream-100">
      {/* Main Footer */}
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-matcha-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Thé Tip Top
              </span>
            </Link>
            <p className="text-cream-300 mb-6 leading-relaxed">
              Découvrez nos thés d'exception, 100% bio et faits main. 
              Participez à notre grand jeu-concours et remportez des lots exclusifs !
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-tea-800 hover:bg-matcha-600 flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Concours Links */}
          <div>
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Le Jeu-Concours
            </h3>
            <ul className="space-y-3">
              {footerLinks.concours.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-cream-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Informations légales
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-cream-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              {footerLinks.contact.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 text-cream-300 hover:text-white transition-colors"
                  >
                    <span className="text-matcha-400">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-tea-800">
        <div className="container-wide py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cream-400 text-sm text-center md:text-left">
              © {currentYear} Thé Tip Top. Tous droits réservés.
              <br className="md:hidden" />
              <span className="md:ml-2">
                Projet étudiant fictif - Aucun achat réel possible.
              </span>
            </p>
            <p className="text-cream-500 text-sm">
              Règlement déposé chez Maître Arnaud Rick, Huissier de Justice
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
