import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Gift, Users, Scale, Mail } from 'lucide-react';
import Card from '../components/common/Card';
import { telemetryService } from '../services/api';

export default function RulesPage() {
  useEffect(() => {
    telemetryService
      .trackEvent({ event: 'rules_view', source: 'rules_page' })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <section className="bg-gradient-to-br from-tea-900 to-tea-950 py-16 relative">
        <div className="absolute inset-0 leaf-pattern opacity-5" />
        <div className="container-wide relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6"><FileText className="w-4 h-4" /> Document officiel</span>
            <h1 className="text-4xl font-display font-bold mb-4">Règlement du jeu-concours</h1>
            <p className="text-cream-200">Règlement déposé chez Maître Arnaud Rick, Huissier de Justice</p>
          </motion.div>
        </div>
      </section>

      <section className="section bg-cream-50">
        <div className="container-wide max-w-4xl">
          <div className="space-y-8">
            <Card>
              <Card.Header><Card.Title as="h2" className="flex items-center gap-3"><Users className="w-6 h-6 text-matcha-600" /> Article 1 - Organisation</Card.Title></Card.Header>
              <div className="prose text-tea-700 space-y-3">
                <p>La société Thé Tip Top, SA au capital de 150 000€, dont le siège social est situé 18 rue Léon Frot, 75011 Paris, immatriculée au RCS de Paris, organise un jeu-concours gratuit sans obligation d'achat du 1er mars au 30 mars 2026.</p>
                <p>Le règlement est déposé chez Maître Arnaud Rick, huissier de justice, et disponible sur le site internet thetiptop.fr.</p>
              </div>
            </Card>

            <Card>
              <Card.Header><Card.Title as="h2" className="flex items-center gap-3"><Calendar className="w-6 h-6 text-matcha-600" /> Article 2 - Dates et durée</Card.Title></Card.Header>
              <div className="prose text-tea-700 space-y-3">
                <p>Le jeu-concours se déroule du <strong>1er mars 2026 à 00h00</strong> au <strong>30 mars 2026 à 23h59</strong> (heure de Paris).</p>
                <p>La réclamation des lots est possible jusqu'au <strong>29 avril 2026</strong>.</p>
                <p>Le tirage au sort pour le gros lot aura lieu le <strong>30 avril 2026</strong>, en présence de Maître Arnaud Rick.</p>
              </div>
            </Card>

            <Card>
              <Card.Header><Card.Title as="h2" className="flex items-center gap-3"><Scale className="w-6 h-6 text-matcha-600" /> Article 3 - Conditions de participation</Card.Title></Card.Header>
              <div className="prose text-tea-700 space-y-3">
                <p>Le jeu-concours est ouvert à toute personne physique majeure (18 ans révolus) résidant en France métropolitaine.</p>
                <p>Sont exclus de la participation : les employés de Thé Tip Top et les membres de leur famille directe.</p>
                <p>Pour participer, il est nécessaire d'effectuer un achat d'un montant minimum de 49€ dans l'une des boutiques Thé Tip Top ou sur le site internet.</p>
                <p>La participation implique l'acceptation pleine et entière du présent règlement.</p>
              </div>
            </Card>

            <Card>
              <Card.Header><Card.Title className="flex items-center gap-3"><Gift className="w-6 h-6 text-matcha-600" /> Article 4 - Lots mis en jeu</Card.Title></Card.Header>
              <div className="prose text-tea-700 space-y-3">
                <p>500 000 tickets sont mis en jeu. 100% des tickets sont gagnants. Les lots sont répartis comme suit :</p>
                <div className="bg-cream-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between"><span>Infuseur à thé (10€)</span><span className="font-medium">60% - 300 000 tickets</span></div>
                  <div className="flex justify-between"><span>Thé détox/infusion 100g (15€)</span><span className="font-medium">20% - 100 000 tickets</span></div>
                  <div className="flex justify-between"><span>Thé signature 100g (25€)</span><span className="font-medium">10% - 50 000 tickets</span></div>
                  <div className="flex justify-between"><span>Coffret découverte (39€)</span><span className="font-medium">6% - 30 000 tickets</span></div>
                  <div className="flex justify-between"><span>Coffret prestige (69€)</span><span className="font-medium">4% - 20 000 tickets</span></div>
                </div>
                <p>Un tirage au sort final désignera un gagnant pour le gros lot : <strong>1 an de thé d'une valeur de 360€</strong>.</p>
              </div>
            </Card>

            <Card>
              <Card.Header><Card.Title as="h2" className="flex items-center gap-3"><FileText className="w-6 h-6 text-matcha-600" /> Article 5 - Données personnelles (RGPD)</Card.Title></Card.Header>
              <div className="prose text-tea-700 space-y-3">
                <p>Les données collectées sont nécessaires à la gestion du jeu-concours. Elles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD).</p>
                <p>Les participants disposent d'un droit d'accès, de rectification, de suppression et de portabilité de leurs données, qu'ils peuvent exercer par email à dpo@thetiptop.fr.</p>
                <p>Les données sont conservées pendant la durée du jeu-concours et 6 mois après la clôture, sauf consentement marketing.</p>
              </div>
            </Card>

            <Card>
              <Card.Header><Card.Title as="h2" className="flex items-center gap-3"><Mail className="w-6 h-6 text-matcha-600" /> Article 6 - Contact</Card.Title></Card.Header>
              <div className="text-tea-700 space-y-2">
                <p>Pour toute question relative au jeu-concours :</p>
                <p>Email : <a href="mailto:concours@thetiptop.fr" className="text-matcha-600 hover:underline">concours@thetiptop.fr</a></p>
                <p>Courrier : Thé Tip Top - Service Jeu-Concours, 18 rue Léon Frot, 75011 Paris</p>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
