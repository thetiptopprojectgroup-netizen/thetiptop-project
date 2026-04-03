import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Gift, HelpCircle } from 'lucide-react';
import Card from '../components/common/Card';
import TicketValidator from '../components/game/TicketValidator';
import useGameStore from '../store/gameStore';

export default function PlayPage() {
  const { contestInfo, fetchContestInfo } = useGameStore();

  useEffect(() => {
    fetchContestInfo();
  }, [fetchContestInfo]);

  const getStatusMessage = () => {
    if (!contestInfo) return null;
    
    switch (contestInfo.status) {
      case 'upcoming':
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Le jeu-concours n\'a pas encore commencé',
          color: 'bg-gold-100 text-gold-700',
        };
      case 'active':
        return {
          icon: <Gift className="w-5 h-5" />,
          text: 'Le jeu-concours est en cours !',
          color: 'bg-matcha-100 text-matcha-700',
        };
      case 'claiming':
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Derniers jours pour réclamer vos gains',
          color: 'bg-gold-100 text-gold-700',
        };
      case 'ended':
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Le jeu-concours est terminé',
          color: 'bg-cream-200 text-tea-700',
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-cream-50 to-white">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Status badge */}
          {statusMessage && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${statusMessage.color}`}>
              {statusMessage.icon}
              {statusMessage.text}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-display font-bold text-tea-900 mb-4">
            Validez votre ticket 🎟️
          </h1>
          <p className="text-tea-600 max-w-md mx-auto">
            Entrez le code à 10 caractères présent sur votre ticket de caisse 
            pour découvrir votre lot !
          </p>
        </motion.div>

        {/* Main validator card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card elevated className="max-w-xl mx-auto">
            <TicketValidator />
          </Card>
        </motion.div>

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 max-w-xl mx-auto"
        >
          <Card className="bg-cream-50 border border-cream-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-matcha-100 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-matcha-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-tea-900 mb-2">
                  Où trouver mon code ?
                </h3>
                <p className="text-tea-600 text-sm leading-relaxed">
                  Votre code unique se trouve en bas de votre ticket de caisse ou sur votre 
                  facture, pour tout achat d'un montant supérieur ou égal à 49€ dans l'une 
                  de nos boutiques Thé Tip Top ou sur notre site internet.
                </p>
                <div className="mt-4 p-4 bg-white rounded-xl border border-cream-200">
                  <div className="text-center">
                    <div className="text-xs text-tea-500 mb-1">Exemple de code :</div>
                    <div className="font-mono text-lg font-bold tracking-widest text-tea-900">
                      ABC123XYZ9
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center gap-6 text-sm"
        >
          <a href="/how-it-works" className="text-matcha-600 hover:text-matcha-700 hover:underline">
            Comment ça marche ?
          </a>
          <a href="/rules" className="text-matcha-600 hover:text-matcha-700 hover:underline">
            Règlement du jeu
          </a>
          <a href="/faq" className="text-matcha-600 hover:text-matcha-700 hover:underline">
            FAQ
          </a>
        </motion.div>
      </div>
    </div>
  );
}
