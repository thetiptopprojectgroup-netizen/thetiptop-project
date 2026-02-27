import { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ContestDateManager() {
  const [contestConfig, setContestConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    contest_start_date: '',
    contest_end_date: '',
    claim_end_date: '',
  });

  useEffect(() => {
    fetchContestConfig();
  }, []);

  const fetchContestConfig = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getContestConfig();
      const config = response.data.data;
      setContestConfig(config);
      
      // Formater les dates pour les inputs
      setFormData({
        contest_start_date: format(new Date(config.contest_start_date), 'yyyy-MM-dd\'T\'HH:mm'),
        contest_end_date: format(new Date(config.contest_end_date), 'yyyy-MM-dd\'T\'HH:mm'),
        claim_end_date: format(new Date(config.claim_end_date), 'yyyy-MM-dd\'T\'HH:mm'),
      });
    } catch (error) {
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    const start = new Date(formData.contest_start_date);
    const end = new Date(formData.contest_end_date);
    const claim = new Date(formData.claim_end_date);

    if (start >= end) {
      toast.error('La date de début doit être avant la date de fin');
      return;
    }

    if (end >= claim) {
      toast.error('La date de fin doit être avant la date de réclamation');
      return;
    }

    try {
      setIsSaving(true);
      await adminService.updateContestConfig({
        contest_start_date: formData.contest_start_date,
        contest_end_date: formData.contest_end_date,
        claim_end_date: formData.claim_end_date,
      });
      
      toast.success('Configuration mise à jour avec succès');
      setIsEditing(false);
      await fetchContestConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-green-600 bg-green-100';
      case 'claim_period':
        return 'text-orange-600 bg-orange-100';
      case 'ended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started':
        return '⏱️ Non commencé';
      case 'in_progress':
        return '🎮 En cours';
      case 'claim_period':
        return '📦 Période de réclamation';
      case 'ended':
        return '✅ Terminé';
      default:
        return 'Inconnu';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-900">Gestion du Concours</h2>
        </div>
      </div>

      {contestConfig && (
        <div className="space-y-6">
          {/* Status actuel */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Statut actuel du concours</p>
            <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(contestConfig.status)}`}>
              {getStatusLabel(contestConfig.status)}
            </p>
          </div>

          {!isEditing ? (
            // Vue de lecture
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date de début */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Début du concours</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(new Date(contestConfig.contest_start_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>

                {/* Date de fin */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Fin du concours</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(new Date(contestConfig.contest_end_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>

                {/* Fin réclamation */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Fin réclamation</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(new Date(contestConfig.claim_end_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Modifier les dates
              </Button>
            </div>
          ) : (
            // Formulaire d'édition
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">Les modifications affecteront immédiatement la disponibilité du concours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Début du concours
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.contest_start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, contest_start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏁 Fin du concours
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.contest_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, contest_end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📦 Fin de la période de réclamation
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.claim_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, claim_end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchContestConfig();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
