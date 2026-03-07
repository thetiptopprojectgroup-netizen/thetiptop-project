import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gift, Trophy, Clock, CheckCircle, ArrowRight, Ticket, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import useGameStore from '../store/gameStore';

const statusConfig = {
  won: { label: 'Gagné', color: 'bg-gold-100 text-gold-700', icon: Gift },
  claimed: { label: 'Récupéré', color: 'bg-matcha-100 text-matcha-700', icon: CheckCircle },
  pending: { label: 'En attente', color: 'bg-cream-200 text-tea-700', icon: Clock },
  expired: { label: 'Expiré', color: 'bg-red-100 text-red-700', icon: Clock },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { participations, isLoading, fetchMyParticipations, deleteMyParticipation } = useGameStore();

  useEffect(() => {
    fetchMyParticipations();
  }, [fetchMyParticipations]);

  const totalValue = participations.reduce((sum, p) => sum + (p.prize?.value || 0), 0);
  const claimedCount = participations.filter((p) => p.status === 'claimed').length;
  const pendingCount = participations.filter((p) => p.status === 'won').length;

  const handleDeleteParticipation = async (participation) => {
    if (participation.status === 'claimed') return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette participation de votre historique ?')) return;
    const result = await deleteMyParticipation(participation.id);
    if (result.success) {
      toast.success('Participation supprimée');
    } else {
      toast.error(result.error || 'Impossible de supprimer cette participation.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Bonjour, {user?.firstName} ! 👋
          </h1>
          <p className="text-tea-600">
            Retrouvez ici l'historique de vos participations et de vos gains.
          </p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-matcha-500 to-matcha-700 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{participations.length}</div>
                <div className="text-matcha-100 text-sm">Participations</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gold-500 to-gold-700 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{totalValue}€</div>
                <div className="text-gold-100 text-sm">Valeur totale</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-matcha-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-matcha-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-tea-900">{claimedCount}</div>
                <div className="text-tea-600 text-sm">Lots récupérés</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-tea-900">{pendingCount}</div>
                <div className="text-tea-600 text-sm">À récupérer</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA to play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-cream-100 to-gold-50 border-2 border-gold-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center">
                  <Ticket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-tea-900 text-lg">
                    Vous avez un nouveau ticket ?
                  </h3>
                  <p className="text-tea-600">
                    Validez-le maintenant et découvrez votre lot !
                  </p>
                </div>
              </div>
              <Link to="/play">
                <Button variant="gold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Valider un ticket
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Participations list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <Card.Header>
              <Card.Title>Historique des participations</Card.Title>
              <Card.Description>
                Tous vos tickets validés et les lots associés
              </Card.Description>
            </Card.Header>

            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-tea-600">Chargement...</p>
              </div>
            ) : participations.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-tea-400" />
                </div>
                <h3 className="font-display font-semibold text-tea-900 mb-2">
                  Aucune participation pour le moment
                </h3>
                <p className="text-tea-600 mb-6">
                  Validez votre premier ticket pour participer au jeu-concours !
                </p>
                <Link to="/play">
                  <Button variant="primary">Valider un ticket</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-cream-200">
                {participations.map((participation, index) => {
                  const status = statusConfig[participation.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <motion.div
                      key={participation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      {/* Prize icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center text-2xl flex-shrink-0">
                        🎁
                      </div>

                      {/* Prize info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-tea-900 truncate">
                          {participation.prize?.name}
                        </h4>
                        <p className="text-sm text-tea-600">
                          Code : <span className="font-mono">{participation.ticketCode}</span>
                        </p>
                        <p className="text-xs text-tea-500">
                          {format(new Date(participation.wonAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <div className="font-bold text-tea-900">
                          {participation.prize?.value}€
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </div>

                      {/* Supprimer */}
                      <button
                        type="button"
                        onClick={() => handleDeleteParticipation(participation)}
                        className="p-2 rounded-lg text-tea-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Supprimer cette participation"
                        aria-label="Supprimer cette participation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Info box */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-gold-50 border border-gold-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gold-200 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gold-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-tea-900 mb-1">
                    Vous avez {pendingCount} lot{pendingCount > 1 ? 's' : ''} à récupérer
                  </h3>
                  <p className="text-tea-600 text-sm mb-3">
                    Rendez-vous dans l'une de nos boutiques Thé Tip Top pour récupérer vos lots.
                  </p>
                  <div className="text-tea-600 text-sm space-y-1">
                    <p>1. Présentez votre code ticket au caissier</p>
                    <p>2. Munissez-vous d'une pièce d'identité</p>
                    <p>3. Récupérez votre lot sur place</p>
                  </div>
                  <p className="text-xs text-tea-500 mt-3">
                    Vous avez jusqu'au 29 avril 2026 pour récupérer vos lots.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
