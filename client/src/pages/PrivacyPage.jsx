import { motion } from 'framer-motion';
import { Shield, Database, Lock, Eye, Trash2, Download } from 'lucide-react';
import Card from '../components/common/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-32 pb-16 bg-cream-50">
      <div className="container-wide max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-tea-600 mb-8">Conformément au Règlement Général sur la Protection des Données (RGPD)</p>
          <div className="space-y-6">
            <Card>
              <div className="flex items-start gap-4">
                <Database className="w-6 h-6 text-matcha-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Données collectées</h2>
                  <p className="text-tea-700 mb-3">Dans le cadre du jeu-concours, nous collectons les données suivantes :</p>
                  <div className="text-tea-600 space-y-1 text-sm">
                    <p>• Identité : nom, prénom, date de naissance, sexe</p>
                    <p>• Contact : email, téléphone, adresse postale</p>
                    <p>• Compte : mot de passe (hashé), type d'authentification</p>
                    <p>• Participation : codes validés, lots gagnés, dates</p>
                    <p>• Technique : adresse IP, navigateur (user-agent)</p>
                    <p>• Consentements : marketing, cookies, date de consentement</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-4">
                <Eye className="w-6 h-6 text-matcha-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Finalités du traitement</h2>
                  <div className="text-tea-700 space-y-2">
                    <p>• Gestion de votre compte et participation au jeu-concours</p>
                    <p>• Attribution et remise des lots</p>
                    <p>• Organisation du tirage au sort final</p>
                    <p>• Communications marketing (avec votre consentement)</p>
                    <p>• Obligations légales et réglementaires</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-matcha-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Sécurité des données</h2>
                  <p className="text-tea-700">Vos données sont protégées par des mesures de sécurité techniques et organisationnelles : chiffrement des mots de passe (bcrypt), connexions sécurisées (HTTPS/TLS), contrôle d'accès strict, et hébergement sécurisé en France.</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-matcha-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Vos droits</h2>
                  <div className="text-tea-700 space-y-2">
                    <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                    <p>• <strong>Droit d'accès</strong> : obtenir une copie de vos données</p>
                    <p>• <strong>Droit de rectification</strong> : corriger vos données</p>
                    <p>• <strong>Droit à l'effacement</strong> : supprimer vos données</p>
                    <p>• <strong>Droit à la portabilité</strong> : récupérer vos données</p>
                    <p>• <strong>Droit d'opposition</strong> : vous opposer au traitement</p>
                    <p>• <strong>Droit de retrait du consentement</strong> : retirer votre consentement à tout moment</p>
                    <p className="mt-4">Pour exercer ces droits : <a href="mailto:dpo@thetiptop.fr" className="text-matcha-600 hover:underline font-medium">dpo@thetiptop.fr</a></p>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Durée de conservation</h2>
              <div className="text-tea-700 space-y-2">
                <p>• Données de compte : durée du jeu-concours + 6 mois</p>
                <p>• Données marketing : jusqu'au retrait du consentement</p>
                <p>• Données de participation : 3 ans (obligation légale)</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-display font-semibold text-tea-900 mb-3">Contact DPO</h2>
              <p className="text-tea-700">Délégué à la protection des données : <a href="mailto:dpo@thetiptop.fr" className="text-matcha-600 hover:underline font-medium">dpo@thetiptop.fr</a></p>
              <p className="text-tea-700 mt-2">En cas de litige, vous pouvez saisir la CNIL : <a href="https://www.cnil.fr" className="text-matcha-600 hover:underline">www.cnil.fr</a></p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
