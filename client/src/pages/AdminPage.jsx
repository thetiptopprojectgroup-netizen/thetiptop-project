import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Ticket, Gift, Trophy, Download, Store,
  Search, RefreshCw, AlertCircle, CheckCircle, Clock, Plus,
  Edit3, Trash2, ChevronLeft, ChevronRight,
  Settings, CalendarDays, Percent, UserPlus, MapPin, ListOrdered,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import ContestDateManager from '../components/admin/ContestDateManager';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';

const PRIZE_FILTER_OPTIONS = [
  { id: '', label: 'Tous les lots' },
  { id: 'infuseur', label: 'Infuseur à thé' },
  { id: 'the_detox', label: 'Thé détox / infusion 100g' },
  { id: 'the_signature', label: 'Thé signature 100g' },
  { id: 'coffret_39', label: 'Coffret 39€' },
  { id: 'coffret_69', label: 'Coffret 69€' },
];

const ETAT_LABELS = {
  disponible: 'Disponible',
  utilise: 'Utilisé',
  reclame: 'Réclamé',
  expire: 'Expiré',
};

/** Numéros de page avec ellipses si beaucoup de pages */
function buildVisiblePages(totalPages, current) {
  if (totalPages <= 1) return [{ type: 'page', n: 1 }];
  if (totalPages <= 12) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', n: i + 1 }));
  }
  const set = new Set([1, totalPages, current]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push({ type: 'ellipsis' });
    out.push({ type: 'page', n: p });
    prev = p;
  }
  return out;
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Users
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);

  // Boutiques
  const [boutiques, setBoutiques] = useState([]);
  const [showBoutiqueModal, setShowBoutiqueModal] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState(null);
  const [boutiqueForm, setBoutiqueForm] = useState({ nom: '', adresse: '', code_postal: '', ville: '', telephone: '', email: '' });

  // Employees
  const [employees, setEmployees] = useState([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'employee', boutique: '' });

  // Game session
  const [gameSession, setGameSession] = useState(null);

  // Game stats
  const [gameStats, setGameStats] = useState(null);

  // Grand prize
  const [showGrandPrizeModal, setShowGrandPrizeModal] = useState(false);
  const [grandPrizeResult, setGrandPrizeResult] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Codes générés (liste paginée)
  const [adminCodes, setAdminCodes] = useState([]);
  const [codesPagination, setCodesPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [codesPage, setCodesPage] = useState(1);
  const [codesSort, setCodesSort] = useState('code');
  const [codesOrder, setCodesOrder] = useState('asc');
  const [codesEtat, setCodesEtat] = useState('');
  const [codesPrizeId, setCodesPrizeId] = useState('');
  const [codeSamples, setCodeSamples] = useState(null);
  const [codesLoading, setCodesLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const params = { page: usersPage, limit: 15 };
      if (userSearch) params.search = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;
      const response = await adminService.getUsers(params);
      setUsers(response.data.data.users);
      setUsersPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Erreur chargement utilisateurs');
    }
  }, [usersPage, userSearch, userRoleFilter]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  const fetchBoutiques = async () => {
    try {
      const response = await adminService.getBoutiques();
      setBoutiques(response.data.data.boutiques);
    } catch (error) {
      toast.error('Erreur chargement boutiques');
    }
  };

  useEffect(() => {
    if (activeTab === 'boutiques') fetchBoutiques();
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      const response = await adminService.getEmployees();
      setEmployees(response.data.data.employees);
    } catch (error) {
      toast.error('Erreur chargement employés');
    }
  };

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
      fetchBoutiques();
    }
  }, [activeTab]);

  const fetchGameSession = async () => {
    try {
      const response = await adminService.getGameSession();
      setGameSession(response.data.data);
    } catch (error) {
      toast.error('Erreur chargement session');
    }
  };

  const fetchGameStats = async () => {
    try {
      const response = await adminService.getGameStats();
      setGameStats(response.data.data);
    } catch (error) {
      toast.error('Erreur chargement statistiques');
    }
  };

  useEffect(() => {
    if (activeTab === 'game') {
      fetchGameSession();
      fetchGameStats();
    }
  }, [activeTab]);

  const fetchCodeSamples = useCallback(async () => {
    try {
      const response = await adminService.getAdminCodeSamples();
      setCodeSamples(response.data.data.samples);
    } catch (error) {
      toast.error('Erreur chargement des aperçus de codes');
    }
  }, []);

  const fetchAdminCodes = useCallback(async () => {
    setCodesLoading(true);
    try {
      const params = {
        page: codesPage,
        limit: 50,
        sort: codesSort,
        order: codesOrder,
      };
      if (codesEtat) params.etat = codesEtat;
      if (codesPrizeId) params.prizeId = codesPrizeId;
      const response = await adminService.getAdminCodes(params);
      setAdminCodes(response.data.data.codes);
      setCodesPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Erreur chargement des codes');
    } finally {
      setCodesLoading(false);
    }
  }, [codesPage, codesSort, codesOrder, codesEtat, codesPrizeId]);

  useEffect(() => {
    if (activeTab === 'codes') {
      fetchCodeSamples();
    }
  }, [activeTab, fetchCodeSamples]);

  useEffect(() => {
    if (activeTab === 'codes') {
      fetchAdminCodes();
    }
  }, [activeTab, fetchAdminCodes]);

  // User actions
  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('Rôle mis à jour');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleToggleUserStatus = async (userId, currentlyActive) => {
    try {
      await adminService.toggleUserStatus(userId, !currentlyActive);
      toast.success(currentlyActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await adminService.deleteUser(userId);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  // Boutique actions
  const handleSaveBoutique = async () => {
    try {
      if (editingBoutique) {
        await adminService.updateBoutique(editingBoutique._id, boutiqueForm);
        toast.success('Boutique modifiée');
      } else {
        await adminService.createBoutique(boutiqueForm);
        toast.success('Boutique créée');
      }
      setShowBoutiqueModal(false);
      setEditingBoutique(null);
      setBoutiqueForm({ nom: '', adresse: '', code_postal: '', ville: '', telephone: '', email: '' });
      fetchBoutiques();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteBoutique = async (id) => {
    if (!window.confirm('Voulez-vous vraiment désactiver cette boutique ?')) return;
    try {
      await adminService.deleteBoutique(id);
      toast.success('Boutique désactivée');
      fetchBoutiques();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const openEditBoutique = (boutique) => {
    setEditingBoutique(boutique);
    setBoutiqueForm({
      nom: boutique.nom, adresse: boutique.adresse, code_postal: boutique.code_postal,
      ville: boutique.ville, telephone: boutique.telephone || '', email: boutique.email || '',
    });
    setShowBoutiqueModal(true);
  };

  // Employee actions
  const handleSaveEmployee = async () => {
    try {
      if (editingEmployee) {
        await adminService.updateEmployee(editingEmployee._id, employeeForm);
        toast.success('Employé modifié');
      } else {
        await adminService.createEmployee(employeeForm);
        toast.success('Employé créé');
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setEmployeeForm({ nom: '', prenom: '', email: '', password: '', role: 'employee', boutique: '' });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Voulez-vous vraiment désactiver cet employé ?')) return;
    try {
      await adminService.deleteEmployee(id);
      toast.success('Employé désactivé');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      nom: emp.nom, prenom: emp.prenom, email: emp.email,
      password: '', role: emp.role, boutique: emp.boutique?._id || '',
    });
    setShowEmployeeModal(true);
  };

  const handleExportEmails = async () => {
    try {
      const response = await adminService.exportEmails();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thetiptop-emails-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success('Export téléchargé !');
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleDrawGrandPrize = async () => {
    setIsDrawing(true);
    try {
      const response = await adminService.drawGrandPrize();
      setGrandPrizeResult(response.data.data.grandPrize);
      toast.success('Tirage effectué avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du tirage');
    } finally {
      setIsDrawing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'codes', label: 'Codes générés', icon: ListOrdered },
    { id: 'contest-config', label: 'Dates du concours', icon: CalendarDays },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'boutiques', label: 'Boutiques', icon: Store },
    { id: 'employees', label: 'Employés', icon: UserPlus },
    { id: 'game', label: 'Gestion du jeu', icon: Settings },
    { id: 'grandprize', label: 'Gros lot', icon: Trophy },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-matcha-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-tea-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">Administration</h1>
              <p className="text-tea-600">Gérez le jeu-concours Thé Tip Top</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leftIcon={<ListOrdered className="w-4 h-4" />} onClick={() => setActiveTab('codes')}>
                Voir les codes générés
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchStats}>
                Actualiser
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-matcha-600 text-white' : 'bg-white text-tea-700 hover:bg-cream-100'
                }`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-matcha-500 to-matcha-700 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Ticket className="w-6 h-6" /></div>
                  <div>
                    <div className="text-3xl font-bold">{stats.tickets.total.toLocaleString()}</div>
                    <div className="text-matcha-100 text-sm">Tickets générés</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm"><span>Utilisés</span><span className="font-bold">{stats.tickets.used.toLocaleString()}</span></div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div className="bg-white rounded-full h-2" style={{ width: `${stats.tickets.total > 0 ? (stats.tickets.used / stats.tickets.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-gold-500 to-gold-700 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Users className="w-6 h-6" /></div>
                  <div>
                    <div className="text-3xl font-bold">{stats.users.total.toLocaleString()}</div>
                    <div className="text-gold-100 text-sm">Utilisateurs</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 text-sm space-y-1">
                  <div className="flex justify-between"><span>Participants</span><span>{stats.users.withParticipation}</span></div>
                  <div className="flex justify-between"><span>Marketing OK</span><span>{stats.users.marketingConsent}</span></div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-matcha-100 flex items-center justify-center"><Gift className="w-6 h-6 text-matcha-600" /></div>
                  <div>
                    <div className="text-3xl font-bold text-tea-900">{stats.tickets.claimed.toLocaleString()}</div>
                    <div className="text-tea-600 text-sm">Lots remis</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center"><Clock className="w-6 h-6 text-gold-600" /></div>
                  <div>
                    <div className="text-3xl font-bold text-tea-900">{(stats.tickets.used - stats.tickets.claimed).toLocaleString()}</div>
                    <div className="text-tea-600 text-sm">À récupérer</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <Card.Header><Card.Title>Répartition des lots</Card.Title></Card.Header>
              <div className="space-y-4">
                {stats.prizes.map((prize) => (
                  <div key={prize.id} className="flex items-center gap-4">
                    <div className="w-10 text-2xl">
                      {prize.id === 'infuseur' ? '🍵' : prize.id === 'the_detox' ? '🌿' : prize.id === 'the_signature' ? '✨' : prize.id === 'coffret_39' ? '🎁' : '👑'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-tea-900">{prize.name}</span>
                        <span className="text-tea-600">{prize.won} / {prize.total}</span>
                      </div>
                      <div className="w-full bg-cream-200 rounded-full h-2">
                        <div className="bg-matcha-500 rounded-full h-2" style={{ width: `${prize.total > 0 ? (prize.won / prize.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {stats.demographics && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <Card.Header><Card.Title>Répartition par genre</Card.Title></Card.Header>
                  <div className="space-y-3">
                    {stats.demographics.gender.map((g) => (
                      <div key={g._id || 'unknown'} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                        <span className="text-tea-700 capitalize">{g._id || 'Non précisé'}</span>
                        <span className="font-bold text-tea-900">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Card.Header><Card.Title>Répartition par âge</Card.Title></Card.Header>
                  <div className="space-y-3">
                    {stats.demographics.age.map((a) => {
                      const labels = { 18: '18-24', 25: '25-34', 35: '35-44', 45: '45-54', 55: '55-64', 65: '65+' };
                      return (
                        <div key={a._id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                          <span className="text-tea-700">{labels[a._id] || a._id}</span>
                          <span className="font-bold text-tea-900">{a.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== CODES / TICKETS TAB ==================== */}
        {activeTab === 'codes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {codeSamples && (
              <Card>
                <Card.Header>
                  <Card.Title>Aperçu : 2 codes par type de lot</Card.Title>
                  <Card.Description>Exemples tirés pour chaque catégorie de gain</Card.Description>
                </Card.Header>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {codeSamples.map((block) => (
                    <div key={block.prize.id} className="rounded-2xl border border-cream-200 bg-cream-50/80 p-4">
                      <div className="font-semibold text-tea-900 mb-3">{block.prize.name}</div>
                      <div className="space-y-2">
                        {block.examples.length === 0 ? (
                          <p className="text-sm text-tea-500">Aucun code pour ce lot</p>
                        ) : (
                          block.examples.map((row) => (
                            <div
                              key={row.id || row.code}
                              className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm border border-cream-100"
                            >
                              <span className="font-mono font-semibold text-tea-900 tracking-wide">{row.code}</span>
                              <span
                                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                                  row.etat === 'disponible'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.etat === 'utilise'
                                      ? 'bg-amber-100 text-amber-800'
                                      : row.etat === 'reclame'
                                        ? 'bg-matcha-100 text-matcha-800'
                                        : 'bg-cream-200 text-tea-600'
                                }`}
                              >
                                {ETAT_LABELS[row.etat] || row.etat}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <Card.Title>Tous les codes générés</Card.Title>
                  <Card.Description>
                    {codesPagination.total != null
                      ? `${codesPagination.total.toLocaleString()} code(s) — affichage par vagues de ${codesPagination.limit || 50}`
                      : 'Chargement…'}
                  </Card.Description>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={fetchAdminCodes}
                  disabled={codesLoading}
                >
                  Actualiser la liste
                </Button>
              </Card.Header>

              <div className="flex flex-col lg:flex-row gap-4 mb-6 flex-wrap">
                <select
                  className="input max-w-[220px]"
                  value={codesPrizeId}
                  onChange={(e) => {
                    setCodesPrizeId(e.target.value);
                    setCodesPage(1);
                  }}
                >
                  {PRIZE_FILTER_OPTIONS.map((o) => (
                    <option key={o.id || 'all'} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="input max-w-[200px]"
                  value={codesEtat}
                  onChange={(e) => {
                    setCodesEtat(e.target.value);
                    setCodesPage(1);
                  }}
                >
                  <option value="">Tous les statuts</option>
                  <option value="disponible">{ETAT_LABELS.disponible}</option>
                  <option value="utilise">{ETAT_LABELS.utilise}</option>
                  <option value="reclame">{ETAT_LABELS.reclame}</option>
                  <option value="expire">{ETAT_LABELS.expire}</option>
                </select>
                <select
                  className="input max-w-[220px]"
                  value={codesSort}
                  onChange={(e) => {
                    setCodesSort(e.target.value);
                    setCodesPage(1);
                  }}
                >
                  <option value="code">Trier par code</option>
                  <option value="date_generation">Trier par date de génération</option>
                  <option value="etat">Trier par statut</option>
                  <option value="createdAt">Trier par date de création</option>
                </select>
                <select
                  className="input max-w-[160px]"
                  value={codesOrder}
                  onChange={(e) => {
                    setCodesOrder(e.target.value);
                    setCodesPage(1);
                  }}
                >
                  <option value="asc">Croissant</option>
                  <option value="desc">Décroissant</option>
                </select>
              </div>

              <div className="overflow-x-auto min-h-[200px]">
                {codesLoading && adminCodes.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-2 border-matcha-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cream-200">
                        <th className="text-left py-3 px-4 font-medium text-tea-600">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-tea-600">Lot</th>
                        <th className="text-left py-3 px-4 font-medium text-tea-600">Gain</th>
                        <th className="text-left py-3 px-4 font-medium text-tea-600">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-tea-600">Généré le</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {adminCodes.map((row) => (
                        <tr key={row.id} className="hover:bg-cream-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-tea-900">{row.code}</td>
                          <td className="py-3 px-4 text-tea-700">
                            {row.lot?.libelle || row.prize?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-tea-600 text-xs">{row.prize?.name || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                row.etat === 'disponible'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.etat === 'utilise'
                                    ? 'bg-amber-100 text-amber-800'
                                    : row.etat === 'reclame'
                                      ? 'bg-matcha-100 text-matcha-800'
                                      : 'bg-cream-200 text-tea-600'
                              }`}
                            >
                              {ETAT_LABELS[row.etat] || row.etat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-tea-500 text-xs whitespace-nowrap">
                            {row.date_generation
                              ? format(new Date(row.date_generation), 'dd/MM/yyyy HH:mm', { locale: fr })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {adminCodes.length === 0 && !codesLoading && (
                <div className="py-12 text-center text-tea-600">
                  <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun code ne correspond aux filtres</p>
                </div>
              )}

              {(codesPagination.total ?? 0) > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-cream-200">
                  <span className="text-sm text-tea-600">
                    Page {codesPagination.page} / {codesPagination.pages} — {codesPagination.total?.toLocaleString()} codes
                  </span>
                  {codesPagination.pages > 1 && (
                    <div className="flex flex-wrap items-center gap-1 justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={codesPage <= 1 || codesLoading}
                        onClick={() => setCodesPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {buildVisiblePages(codesPagination.pages, codesPage).map((item, idx) =>
                        item.type === 'ellipsis' ? (
                          <span key={`e-${idx}`} className="px-2 text-tea-400">
                            …
                          </span>
                        ) : (
                          <button
                            key={item.n}
                            type="button"
                            onClick={() => setCodesPage(item.n)}
                            disabled={codesLoading}
                            className={`min-w-[2.25rem] h-9 rounded-lg text-sm font-medium transition-colors ${
                              codesPage === item.n
                                ? 'bg-matcha-600 text-white'
                                : 'bg-cream-100 text-tea-700 hover:bg-cream-200'
                            }`}
                          >
                            {item.n}
                          </button>
                        )
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={codesPage >= codesPagination.pages || codesLoading}
                        onClick={() => setCodesPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ==================== CONTEST CONFIG TAB ==================== */}
        {activeTab === 'contest-config' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ContestDateManager />
          </motion.div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <Card.Title>Gestion des utilisateurs</Card.Title>
                  <Card.Description>Ajouter, modifier, supprimer les rôles utilisateurs</Card.Description>
                </div>
                <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportEmails} size="sm">
                  Exporter CSV
                </Button>
              </Card.Header>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher par nom, prénom ou email..."
                    leftIcon={<Search className="w-5 h-5" />}
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                  />
                </div>
                <select
                  className="input max-w-[200px]"
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                >
                  <option value="">Tous les rôles</option>
                  <option value="user">Utilisateur</option>
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200">
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Rôle</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Inscription</th>
                      <th className="text-right py-3 px-4 font-medium text-tea-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-cream-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-matcha-100 flex items-center justify-center text-matcha-700 font-medium text-xs">
                              {(u.firstName?.[0] || '')}{(u.lastName?.[0] || '')}
                            </div>
                            <span className="font-medium text-tea-900">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-tea-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-cream-300 bg-white"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="employee">Employé</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.isActive !== false)}
                            className={`badge text-xs cursor-pointer ${u.isActive !== false ? 'badge-success' : 'bg-red-100 text-red-700'}`}
                          >
                            {u.isActive !== false ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-tea-500 text-xs">
                          {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: fr }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <div className="py-12 text-center text-tea-600">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              )}

              {usersPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-200">
                  <span className="text-sm text-tea-600">
                    Page {usersPagination.page} sur {usersPagination.pages} ({usersPagination.total} utilisateurs)
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={usersPage <= 1} onClick={() => setUsersPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" disabled={usersPage >= usersPagination.pages} onClick={() => setUsersPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ==================== BOUTIQUES TAB ==================== */}
        {activeTab === 'boutiques' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header className="flex items-center justify-between">
                <div>
                  <Card.Title>Gestion des boutiques</Card.Title>
                  <Card.Description>Ajouter, modifier et gérer les boutiques</Card.Description>
                </div>
                <Button
                  variant="primary" size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => { setEditingBoutique(null); setBoutiqueForm({ nom: '', adresse: '', code_postal: '', ville: '', telephone: '', email: '' }); setShowBoutiqueModal(true); }}
                >
                  Ajouter
                </Button>
              </Card.Header>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boutiques.map((b) => (
                  <div key={b._id} className={`p-4 rounded-xl border-2 ${b.actif ? 'border-cream-200 bg-white' : 'border-red-200 bg-red-50 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-matcha-600" />
                        <h3 className="font-semibold text-tea-900">{b.nom}</h3>
                      </div>
                      <span className={`badge text-xs ${b.actif ? 'badge-success' : 'bg-red-100 text-red-700'}`}>
                        {b.actif ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-tea-600 space-y-1 mb-4">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.adresse}, {b.code_postal} {b.ville}</p>
                      {b.telephone && <p>{b.telephone}</p>}
                      {b.email && <p>{b.email}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" leftIcon={<Edit3 className="w-3 h-3" />} onClick={() => openEditBoutique(b)}>
                        Modifier
                      </Button>
                      {b.actif && (
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteBoutique(b._id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {boutiques.length === 0 && (
                <div className="py-12 text-center text-tea-600">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune boutique enregistrée</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ==================== EMPLOYEES TAB ==================== */}
        {activeTab === 'employees' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header className="flex items-center justify-between">
                <div>
                  <Card.Title>Gestion des employés boutique</Card.Title>
                  <Card.Description>Gérer les comptes employés et leurs affectations</Card.Description>
                </div>
                <Button
                  variant="primary" size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => { setEditingEmployee(null); setEmployeeForm({ nom: '', prenom: '', email: '', password: '', role: 'employee', boutique: '' }); setShowEmployeeModal(true); }}
                >
                  Ajouter
                </Button>
              </Card.Header>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200">
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Employé</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Boutique</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Rôle</th>
                      <th className="text-left py-3 px-4 font-medium text-tea-600">Statut</th>
                      <th className="text-right py-3 px-4 font-medium text-tea-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-cream-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-tea-900">{emp.prenom} {emp.nom}</td>
                        <td className="py-3 px-4 text-tea-600">{emp.email}</td>
                        <td className="py-3 px-4 text-tea-600">{emp.boutique?.nom || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="badge badge-info text-xs capitalize">{emp.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge text-xs ${emp.actif ? 'badge-success' : 'bg-red-100 text-red-700'}`}>
                            {emp.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditEmployee(emp)} className="p-1.5 rounded-lg hover:bg-cream-100 text-tea-600" title="Modifier">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {emp.actif && (
                              <button onClick={() => handleDeleteEmployee(emp._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Désactiver">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {employees.length === 0 && (
                <div className="py-12 text-center text-tea-600">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun employé enregistré</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ==================== GAME TAB ==================== */}
        {activeTab === 'game' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {gameSession && (
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Session de jeu</Card.Title>
                  <Card.Description>Paramètres de la session de jeu en cours</Card.Description>
                </Card.Header>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="text-sm text-tea-600 mb-1">Début du jeu</div>
                    <div className="font-bold text-tea-900">{format(new Date(gameSession.session.startDate), 'd MMMM yyyy', { locale: fr })}</div>
                  </div>
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="text-sm text-tea-600 mb-1">Fin du jeu</div>
                    <div className="font-bold text-tea-900">{format(new Date(gameSession.session.endDate), 'd MMMM yyyy', { locale: fr })}</div>
                  </div>
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="text-sm text-tea-600 mb-1">Fin des réclamations</div>
                    <div className="font-bold text-tea-900">{format(new Date(gameSession.session.claimEndDate), 'd MMMM yyyy', { locale: fr })}</div>
                  </div>
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="text-sm text-tea-600 mb-1">Tickets max</div>
                    <div className="font-bold text-tea-900">{gameSession.session.maxTickets.toLocaleString()}</div>
                  </div>
                </div>

                <h3 className="font-display font-semibold text-tea-900 mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5" /> Répartition des gains
                </h3>
                <div className="space-y-3">
                  {gameSession.prizeDistribution.map((prize) => (
                    <div key={prize.id} className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-tea-900">{prize.name}</span>
                          <span className="text-tea-600">{prize.percentage}% - {prize.value}€</span>
                        </div>
                        <div className="w-full bg-cream-200 rounded-full h-2">
                          <div className="bg-matcha-500 rounded-full h-2" style={{ width: `${prize.percentage}%` }} />
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-bold text-tea-900">{prize.total.toLocaleString()}</div>
                        <div className="text-tea-500">tickets</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {gameStats && (
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Statistiques du jeu</Card.Title>
                </Card.Header>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-matcha-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-matcha-700">{gameStats.overview.usageRate}%</div>
                    <div className="text-sm text-tea-600">Taux d'utilisation</div>
                  </div>
                  <div className="p-4 bg-gold-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-gold-700">{gameStats.overview.claimRate}%</div>
                    <div className="text-sm text-tea-600">Taux de réclamation</div>
                  </div>
                  <div className="p-4 bg-cream-100 rounded-xl text-center">
                    <div className="text-2xl font-bold text-tea-900">{gameStats.overview.pendingClaims.toLocaleString()}</div>
                    <div className="text-sm text-tea-600">Lots en attente</div>
                  </div>
                  <div className="p-4 bg-cream-100 rounded-xl text-center">
                    <div className="text-2xl font-bold text-tea-900">{gameStats.overview.totalPrizeValue.toLocaleString()}€</div>
                    <div className="text-sm text-tea-600">Valeur totale gagnée</div>
                  </div>
                </div>

                {gameStats.dailyParticipations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-tea-900 mb-3">Participations journalières (30 derniers jours)</h4>
                    <div className="flex items-end gap-1 h-32">
                      {gameStats.dailyParticipations.map((day) => {
                        const maxCount = Math.max(...gameStats.dailyParticipations.map((d) => d.count));
                        const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        return (
                          <div key={day._id} className="flex-1 flex flex-col items-center gap-1" title={`${day._id}: ${day.count}`}>
                            <div className="w-full bg-matcha-500 rounded-t" style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-tea-500 mt-1">
                      <span>{gameStats.dailyParticipations[0]?._id}</span>
                      <span>{gameStats.dailyParticipations[gameStats.dailyParticipations.length - 1]?._id}</span>
                    </div>
                  </div>
                )}

                {gameStats.hourlyParticipations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-tea-900 mb-3">Distribution horaire</h4>
                    <div className="flex items-end gap-1 h-24">
                      {Array.from({ length: 24 }, (_, h) => {
                        const hourData = gameStats.hourlyParticipations.find((hp) => hp._id === h);
                        const count = hourData?.count || 0;
                        const maxCount = Math.max(...gameStats.hourlyParticipations.map((d) => d.count));
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={h} className="flex-1 flex flex-col items-center" title={`${h}h: ${count}`}>
                            <div className="w-full bg-gold-400 rounded-t" style={{ height: `${height}%`, minHeight: count > 0 ? '2px' : '0' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-tea-500 mt-1">
                      <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 rounded-xl border-2 border-gold-200 bg-gold-50">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-gold-600" />
                    <div>
                      <div className="font-semibold text-tea-900">Tirage au sort du gros lot</div>
                      <div className="text-sm text-tea-600">
                        {gameStats.grandPrize.drawn
                          ? `Effectué - Gagnant: ${gameStats.grandPrize.winner}`
                          : 'Pas encore effectué'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* ==================== GRAND PRIZE TAB ==================== */}
        {activeTab === 'grandprize' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="max-w-2xl mx-auto text-center">
              <div className="py-8">
                <div className="text-6xl mb-6">🏆</div>
                <h2 className="text-2xl font-display font-bold text-tea-900 mb-2">Tirage au sort du gros lot</h2>
                <p className="text-tea-600 mb-8">1 an de thé d'une valeur de 360€</p>

                {grandPrizeResult ? (
                  <div className="bg-gold-50 border-2 border-gold-200 rounded-2xl p-6 mb-6">
                    <div className="text-sm text-gold-700 font-medium mb-2">Gagnant</div>
                    <div className="text-2xl font-display font-bold text-tea-900">
                      {grandPrizeResult.winner?.firstName} {grandPrizeResult.winner?.lastName}
                    </div>
                    <div className="text-tea-600">{grandPrizeResult.winner?.email}</div>
                    <div className="mt-4 text-sm text-tea-500">
                      Tiré le {format(new Date(grandPrizeResult.drawDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-cream-100 rounded-2xl p-6 mb-6">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gold-600" />
                    <p className="text-tea-600">Le tirage n'a pas encore été effectué.</p>
                  </div>
                )}

                <Button variant="gold" size="lg" onClick={() => setShowGrandPrizeModal(true)} disabled={!!grandPrizeResult}>
                  {grandPrizeResult ? 'Tirage déjà effectué' : 'Effectuer le tirage'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ==================== MODALS ==================== */}

        <Modal isOpen={showGrandPrizeModal} onClose={() => setShowGrandPrizeModal(false)} title="Confirmer le tirage au sort">
          <div className="text-center">
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-tea-600 mb-6">Êtes-vous sûr de vouloir effectuer le tirage au sort du gros lot ? Cette action est irréversible.</p>
            <p className="text-sm text-tea-500 mb-6">Le tirage sera supervisé par Maître Arnaud Rick, huissier de justice.</p>
            <Modal.Actions>
              <Button variant="secondary" onClick={() => setShowGrandPrizeModal(false)}>Annuler</Button>
              <Button variant="gold" onClick={handleDrawGrandPrize} isLoading={isDrawing}>Confirmer le tirage</Button>
            </Modal.Actions>
          </div>
        </Modal>

        <Modal isOpen={showBoutiqueModal} onClose={() => setShowBoutiqueModal(false)} title={editingBoutique ? 'Modifier la boutique' : 'Ajouter une boutique'}>
          <div className="space-y-4">
            <Input label="Nom" value={boutiqueForm.nom} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, nom: e.target.value })} required />
            <Input label="Adresse" value={boutiqueForm.adresse} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, adresse: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Code postal" value={boutiqueForm.code_postal} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, code_postal: e.target.value })} required />
              <Input label="Ville" value={boutiqueForm.ville} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, ville: e.target.value })} required />
            </div>
            <Input label="Téléphone" value={boutiqueForm.telephone} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, telephone: e.target.value })} />
            <Input label="Email" type="email" value={boutiqueForm.email} onChange={(e) => setBoutiqueForm({ ...boutiqueForm, email: e.target.value })} />
            <Modal.Actions>
              <Button variant="secondary" onClick={() => setShowBoutiqueModal(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleSaveBoutique}>{editingBoutique ? 'Modifier' : 'Créer'}</Button>
            </Modal.Actions>
          </div>
        </Modal>

        <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title={editingEmployee ? "Modifier l'employé" : 'Ajouter un employé'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" value={employeeForm.prenom} onChange={(e) => setEmployeeForm({ ...employeeForm, prenom: e.target.value })} required />
              <Input label="Nom" value={employeeForm.nom} onChange={(e) => setEmployeeForm({ ...employeeForm, nom: e.target.value })} required />
            </div>
            <Input label="Email" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} required />
            {!editingEmployee && (
              <Input label="Mot de passe" type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} required />
            )}
            <div>
              <label className="label">Boutique</label>
              <select className="input" value={employeeForm.boutique} onChange={(e) => setEmployeeForm({ ...employeeForm, boutique: e.target.value })} required>
                <option value="">Sélectionner une boutique</option>
                {boutiques.filter((b) => b.actif).map((b) => (
                  <option key={b._id} value={b._id}>{b.nom} - {b.ville}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rôle</label>
              <select className="input" value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}>
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <Modal.Actions>
              <Button variant="secondary" onClick={() => setShowEmployeeModal(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleSaveEmployee}>{editingEmployee ? 'Modifier' : 'Créer'}</Button>
            </Modal.Actions>
          </div>
        </Modal>
      </div>
    </div>
  );
}
