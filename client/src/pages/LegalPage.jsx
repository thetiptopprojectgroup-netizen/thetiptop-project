import { motion } from 'framer-motion';
import Card from '../components/common/Card';

export default function LegalPage() {
  return (
    <div className="min-h-screen pt-32 pb-16 bg-cream-50">
      <div className="container-wide max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-8">Mentions légales</h1>
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-display font-semibold text-tea-900 mb-4">Éditeur du site</h2>
              <div className="text-tea-700 space-y-2">
                <p><strong>Thé Tip Top</strong> - Société Anonyme au capital de 150 000€</p>
                <p>Siège social : 18 rue Léon Frot, 75011 Paris</p>
                <p>RCS Paris : XXX XXX XXX</p>
                <p>N° TVA intracommunautaire : FR XX XXX XXX XXX</p>
                <p>Directeur de la publication : Eric Bourdon</p>
                <p>Contact : contact@thetiptop.fr | 01 23 45 67 89</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-display font-semibold text-tea-900 mb-4">Hébergement</h2>
              <div className="text-tea-700 space-y-2">
                <p><strong>OVH SAS</strong></p>
                <p>2 Rue Kellermann, 59100 Roubaix, France</p>
                <p>Tél : 1007 | Site : www.ovh.com</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-display font-semibold text-tea-900 mb-4">Propriété intellectuelle</h2>
              <p className="text-tea-700">L'ensemble du contenu de ce site (textes, images, logos, graphismes) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, même partielle, est interdite sans autorisation préalable écrite.</p>
            </Card>
            <Card>
              <h2 className="text-xl font-display font-semibold text-tea-900 mb-4">Huissier de justice</h2>
              <p className="text-tea-700">Le règlement du jeu-concours est déposé chez Maître Arnaud Rick, huissier de justice, Cabinet Rick & Associés, 25 Rue de la Paix, 75002 Paris.</p>
            </Card>
            <Card className="bg-gold-50 border border-gold-200">
              <p className="text-tea-600 text-sm text-center">⚠️ Projet étudiant fictif réalisé dans le cadre du diplôme Expert en Stratégie Digitale et Transformation - Institut F2i / École DSP. Aucun achat réel possible.</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
