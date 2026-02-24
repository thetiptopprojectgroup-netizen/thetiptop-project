import { motion } from 'framer-motion';
import Card from '../components/common/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-16 bg-cream-50">
      <div className="container-wide max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-tea-600 mb-8">Dernière mise à jour : 1er janvier 2026</p>
          <div className="space-y-6">
            {[
              { title: 'Article 1 - Objet', content: "Les présentes CGU régissent l'utilisation du site internet thetiptop.fr, édité par la société Thé Tip Top. L'inscription et l'utilisation du site impliquent l'acceptation pleine et entière de ces conditions." },
              { title: 'Article 2 - Inscription', content: "L'inscription est gratuite et ouverte à toute personne physique majeure. L'utilisateur s'engage à fournir des informations exactes et à jour. Le compte est personnel et non cessible." },
              { title: 'Article 3 - Participation au jeu-concours', content: "La participation au jeu-concours est subordonnée à l'inscription sur le site et à la saisie d'un code valide obtenu lors d'un achat en boutique ou en ligne. Chaque code ne peut être utilisé qu'une seule fois." },
              { title: 'Article 4 - Responsabilité', content: "Thé Tip Top s'efforce d'assurer la disponibilité du site mais ne garantit pas un accès ininterrompu. La société ne saurait être tenue responsable des dommages résultant de l'utilisation du site." },
              { title: "Article 5 - Propriété intellectuelle", content: "L'ensemble des éléments du site (textes, images, logos, design) est la propriété exclusive de Thé Tip Top. Toute reproduction ou utilisation non autorisée est interdite." },
              { title: 'Article 6 - Données personnelles', content: "Les données personnelles sont traitées conformément au RGPD et à notre Politique de Confidentialité. L'utilisateur peut exercer ses droits (accès, rectification, suppression, portabilité) en contactant dpo@thetiptop.fr." },
              { title: 'Article 7 - Droit applicable', content: "Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Paris." },
            ].map((article) => (
              <Card key={article.title}>
                <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">{article.title}</h2>
                <p className="text-tea-700 leading-relaxed">{article.content}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
