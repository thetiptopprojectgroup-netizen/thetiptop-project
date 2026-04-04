import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Ticket,
  Gift,
  CheckCircle,
  User,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { employeeService } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function EmployeePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('search-client');

  /* --- Recherche client + autocomplétion --- */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestRef = useRef(null);

  const [customerPrizes, setCustomerPrizes] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  /* --- Ticket code --- */
  const [searchCode, setSearchCode] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);

  /* --- Lots remis --- */
  const [remiseFilters, setRemiseFilters] = useState({
    dateFrom: '',
    dateTo: '',
    email: '',
    firstName: '',
    lastName: '',
    ticketCode: '',
  });
  const [remises, setRemises] = useState([]);
  const [remisePage, setRemisePage] = useState(1);
  const [remisePagination, setRemisePagination] = useState({ total: 0, pages: 1 });
  const [loadingRemises, setLoadingRemises] = useState(false);

  const loadCustomerByEmail = useCallback(async (email) => {
    if (!email?.trim()) return;
    setIsSearching(true);
    try {
      const response = await employeeService.getCustomerPrizes(email.trim());
      setCustomerInfo(response.data.data.customer);
      setCustomerPrizes(response.data.data.participations);
      if (response.data.data.participations.length === 0) {
        toast.error('Aucune participation trouvée pour cet email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de recherche');
      setCustomerPrizes([]);
      setCustomerInfo(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    const t = setTimeout(async () => {
      try {
        const res = await employeeService.searchCustomers(searchQuery.trim());
        setSuggestions(res.data.data.suggestions || []);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const close = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSelectSuggestion = (s) => {
    setSearchEmail(s.email);
    const codeHint =
      s.type === 'ticket' && s.ticketCode
        ? s.ticketCode
        : Array.isArray(s.ticketCodes) && s.ticketCodes.length > 0
          ? s.ticketCodes[0]
          : '—';
    setSearchQuery(`${s.fullName} · ${s.email} · ${codeHint}`);
    setShowSuggest(false);
    loadCustomerByEmail(s.email);
  };

  const handleSearchCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim() && searchQuery.includes('@')) {
      const m = searchQuery.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
      if (m) setSearchEmail(m[1]);
    }
    const email = searchEmail.trim() || searchQuery.trim();
    if (!email || !email.includes('@')) {
      toast.error('Saisissez un email ou choisissez une proposition');
      return;
    }
    await loadCustomerByEmail(email);
  };

  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!searchCode || searchCode.length !== 10) return;
    setIsSearching(true);
    try {
      const response = await employeeService.getTicketByCode(searchCode.toUpperCase());
      setTicketDetails(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ticket non trouvé');
      setTicketDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  const refreshTicketDetails = async () => {
    if (!searchCode || searchCode.length !== 10) return;
    try {
      const response = await employeeService.getTicketByCode(searchCode.toUpperCase());
      setTicketDetails(response.data.data);
    } catch {
      setTicketDetails(null);
    }
  };

  const handleClaimPrize = async (code) => {
    try {
      await employeeService.claimPrize(code, 'Boutique');
      toast.success('Lot marqué comme remis !');
      if (ticketDetails) await refreshTicketDetails();
      if (searchEmail) loadCustomerByEmail(searchEmail);
      if (activeTab === 'remises') fetchRemises(remisePage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la remise');
    }
  };

  const fetchRemises = useCallback(
    async (pageOverride) => {
      const page = pageOverride ?? remisePage;
      setLoadingRemises(true);
      try {
        const { data } = await employeeService.getRemisesLots({
          page,
          limit: 15,
          ...Object.fromEntries(
            Object.entries(remiseFilters).filter(([, v]) => v != null && String(v).trim() !== '')
          ),
        });
        setRemises(data.data.remises);
        setRemisePagination(data.data.pagination);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Impossible de charger les lots remis');
      } finally {
        setLoadingRemises(false);
      }
    },
    [remisePage, remiseFilters]
  );

  useEffect(() => {
    if (activeTab === 'remises') fetchRemises();
  }, [activeTab, fetchRemises]);

  const tabs = [
    { id: 'search-client', label: 'Recherche client', icon: User },
    { id: 'search-code', label: 'Vérifier un ticket', icon: Ticket },
    { id: 'remises', label: 'Lots remis', icon: ListChecks },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">Espace Caissier</h1>
          <p className="text-tea-600">
            Bienvenue {user?.firstName}. Recherche client (email, nom ou code ticket), vérification
            ticket, historique des lots remis.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-matcha-600 text-white'
                    : 'bg-white text-tea-700 hover:bg-cream-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Recherche client + autocomplete */}
        {activeTab === 'search-client' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Rechercher un client</Card.Title>
                <Card.Description>
                  Tapez un <strong>email</strong>, un <strong>nom</strong>, un <strong>prénom</strong> ou un{' '}
                  <strong>code ticket</strong> — sélectionnez une proposition pour charger les gains.
                </Card.Description>
              </Card.Header>
              <form onSubmit={handleSearchCustomerSubmit} className="space-y-4">
                <div className="relative" ref={suggestRef}>
                  <Input
                    type="search"
                    autoComplete="off"
                    placeholder="Ex. dupont / client@mail.com / ABC12..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchEmail('');
                    }}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggest(true)}
                    leftIcon={<Search className="w-5 h-5" />}
                  />
                  {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
                    <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-cream-200 bg-white shadow-elevated py-1 text-sm">
                      {loadingSuggest && (
                        <li className="px-4 py-3 text-tea-500">Recherche…</li>
                      )}
                      {!loadingSuggest &&
                        suggestions.map((s, idx) => (
                          <li key={`${s.type}-${String(s.userId)}-${s.ticketCode || idx}`}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-cream-50 border-b border-cream-100 last:border-0"
                              onClick={() => handleSelectSuggestion(s)}
                            >
                              <div className="font-semibold text-tea-900">
                                {s.firstName} {s.lastName}
                              </div>
                              <div className="text-tea-600 text-xs mt-0.5">{s.email}</div>
                              <div className="text-matcha-700 font-mono text-xs mt-1">
                                {s.type === 'ticket' && s.ticketCode
                                  ? `Ticket : ${s.ticketCode}`
                                  : s.ticketCodes?.length
                                    ? `Ticket(s) : ${s.ticketCodes.join(', ')}`
                                    : null}
                              </div>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                <input type="hidden" value={searchEmail} readOnly />
                <Button type="submit" variant="primary" className="w-full" isLoading={isSearching}>
                  Charger les gains (email sélectionné ou saisi)
                </Button>
              </form>
            </Card>

            {customerInfo && (
              <Card>
                <Card.Header>
                  <Card.Title>Client : {customerInfo.fullName}</Card.Title>
                  <Card.Description>{customerInfo.email}</Card.Description>
                </Card.Header>
                {customerPrizes.length === 0 ? (
                  <div className="py-8 text-center text-tea-600">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune participation trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerPrizes.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-cream-50 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-gold-600" />
                          </div>
                          <div>
                            <div className="font-medium text-tea-900">{p.prize?.name}</div>
                            <div className="text-sm text-tea-600">
                              Code: <span className="font-mono">{p.ticketCode}</span> · {p.prize?.value}€
                            </div>
                            <div className="text-xs text-tea-500">
                              {format(new Date(p.wonAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </div>
                          </div>
                        </div>
                        {p.status === 'won' || p.status === 'reclaim_requested' ? (
                          <Button size="sm" variant="gold" onClick={() => handleClaimPrize(p.ticketCode)}>
                            Remettre le lot
                          </Button>
                        ) : p.status === 'remis' || p.status === 'claimed' ? (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Remis
                          </span>
                        ) : (
                          <span className="text-xs text-tea-500 capitalize">{p.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'search-code' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Tester un numéro de ticket</Card.Title>
                <Card.Description>Entrez le code à 10 caractères pour vérifier son statut</Card.Description>
              </Card.Header>
              <form onSubmit={handleSearchTicket} className="space-y-4">
                <Input
                  placeholder="XXXXXXXXXX"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="font-mono tracking-widest text-center text-xl"
                  leftIcon={<Ticket className="w-5 h-5" />}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSearching}
                  disabled={searchCode.length !== 10}
                >
                  Vérifier le ticket
                </Button>
              </form>
            </Card>

            {ticketDetails && (
              <Card>
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">
                    {ticketDetails.ticket.status === 'available'
                      ? '🎫'
                      : ticketDetails.ticket.etat === 'reclame'
                        ? '✅'
                        : '🎁'}
                  </div>
                  <div className="font-display font-bold text-2xl text-tea-900 mb-1">
                    {ticketDetails.ticket.prize.name}
                  </div>
                  <div className="text-gold-600 font-semibold text-lg mb-4">
                    {ticketDetails.ticket.prize.value}€
                  </div>

                  <div className="max-w-sm mx-auto space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-cream-50 rounded-xl">
                      <span className="text-tea-600">Code</span>
                      <span className="font-mono font-medium">{ticketDetails.ticket.code}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-cream-50 rounded-xl">
                      <span className="text-tea-600">Statut</span>
                      <span
                        className={`font-medium ${
                          ticketDetails.ticket.etat === 'reclame'
                            ? 'text-matcha-600'
                            : ticketDetails.ticket.status === 'used'
                              ? 'text-gold-600'
                              : ticketDetails.ticket.status === 'available'
                                ? 'text-blue-600'
                                : 'text-red-600'
                        }`}
                      >
                        {ticketDetails.ticket.status === 'available'
                          ? 'Disponible'
                          : ticketDetails.ticket.status === 'used'
                            ? 'Utilisé — à remettre au client'
                            : ticketDetails.ticket.etat === 'reclame'
                              ? 'Lot remis'
                              : ticketDetails.ticket.etat}
                      </span>
                    </div>
                    {ticketDetails.participation?.user && (
                      <div className="flex justify-between p-3 bg-cream-50 rounded-xl">
                        <span className="text-tea-600">Client</span>
                        <span>{ticketDetails.participation.user.email}</span>
                      </div>
                    )}
                  </div>

                  {ticketDetails.ticket.status === 'used' && (
                    <Button
                      variant="gold"
                      size="lg"
                      className="mt-6"
                      onClick={() => handleClaimPrize(ticketDetails.ticket.code)}
                    >
                      Marquer comme remis
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'remises' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Lots remis</Card.Title>
                <Card.Description>
                  Historique des réclamations (boutique ou en ligne). Filtrez par période ou client.
                </Card.Description>
              </Card.Header>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <Input
                  type="date"
                  label="Du"
                  value={remiseFilters.dateFrom}
                  onChange={(e) => setRemiseFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                />
                <Input
                  type="date"
                  label="Au"
                  value={remiseFilters.dateTo}
                  onChange={(e) => setRemiseFilters((f) => ({ ...f, dateTo: e.target.value }))}
                />
                <Input
                  placeholder="Email client"
                  value={remiseFilters.email}
                  onChange={(e) => setRemiseFilters((f) => ({ ...f, email: e.target.value }))}
                />
                <Input
                  placeholder="Prénom"
                  value={remiseFilters.firstName}
                  onChange={(e) => setRemiseFilters((f) => ({ ...f, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Nom"
                  value={remiseFilters.lastName}
                  onChange={(e) => setRemiseFilters((f) => ({ ...f, lastName: e.target.value }))}
                />
                <Input
                  placeholder="Code ticket"
                  value={remiseFilters.ticketCode}
                  onChange={(e) =>
                    setRemiseFilters((f) => ({ ...f, ticketCode: e.target.value.toUpperCase() }))
                  }
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setRemisePage(1);
                    fetchRemises(1);
                  }}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Appliquer les filtres
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-cream-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-cream-100 text-tea-700">
                    <tr>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">Date remise</th>
                      <th className="px-3 py-3 font-medium">Client</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium font-mono">Ticket</th>
                      <th className="px-3 py-3 font-medium">Lot</th>
                      <th className="px-3 py-3 font-medium">Mode</th>
                      <th className="px-3 py-3 font-medium">Remis par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 bg-white">
                    {loadingRemises ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-tea-500">
                          Chargement…
                        </td>
                      </tr>
                    ) : remises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-tea-500">
                          Aucun lot remis avec ces critères.
                        </td>
                      </tr>
                    ) : (
                      remises.map((r) => (
                        <tr key={r.id} className="hover:bg-cream-50">
                          <td className="px-3 py-2 whitespace-nowrap text-tea-800">
                            {format(new Date(r.dateRemise), "d MMM yyyy HH:mm", { locale: fr })}
                          </td>
                          <td className="px-3 py-2">
                            {r.clientPrenom} {r.clientNom}
                          </td>
                          <td className="px-3 py-2 text-tea-600 break-all">{r.clientEmail}</td>
                          <td className="px-3 py-2 font-mono text-xs">{r.ticketCode}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-tea-900">{r.prizeName}</div>
                            <div className="text-xs text-gold-700">{r.prizeValue}€</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-cream-100 text-xs">
                              {r.modeRemise === 'en_ligne' ? 'En ligne' : 'Boutique'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-tea-600 text-xs">{r.remisPar}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {remisePagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-200">
                  <p className="text-sm text-tea-600">
                    Page {remisePage} / {remisePagination.pages} — {remisePagination.total} lot(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={remisePage <= 1}
                      onClick={() => setRemisePage((p) => Math.max(1, p - 1))}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Préc.
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={remisePage >= remisePagination.pages}
                      onClick={() => setRemisePage((p) => p + 1)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Suiv.
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
