import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Ticket, Gift, CheckCircle, Clock, User, RefreshCw, X, Loader2
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
  const [activeTab, setActiveTab] = useState('search-email');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [customerPrizes, setCustomerPrizes] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await employeeService.searchCustomers(query);
      setSuggestions(response.data.data.customers);
      setShowSuggestions(response.data.data.customers.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchEmail);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchEmail, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSelectCustomer(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectCustomer = (customer) => {
    setSearchEmail(customer.email);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setSearchEmail('');
    setSuggestions([]);
    setShowSuggestions(false);
    setCustomerInfo(null);
    setCustomerPrizes([]);
    inputRef.current?.focus();
  };

  const handleSearchCustomer = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;
    setShowSuggestions(false);
    setIsSearching(true);
    try {
      const response = await employeeService.getCustomerPrizes(searchEmail);
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

  const handleClaimPrize = async (code) => {
    try {
      await employeeService.claimPrize(code, 'Boutique');
      toast.success('Lot marqué comme remis !');
      if (ticketDetails) handleSearchTicket({ preventDefault: () => {} });
      if (searchEmail) handleSearchCustomer({ preventDefault: () => {} });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la remise');
    }
  };

  const tabs = [
    { id: 'search-email', label: 'Recherche client', icon: User },
    { id: 'search-code', label: 'Vérifier un ticket', icon: Ticket },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-cream-50">
      <div className="container-wide max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold text-tea-900 mb-2">
            Espace Caissier
          </h1>
          <p className="text-tea-600">
            Bienvenue {user?.firstName}. Recherchez les gains d'un client ou vérifiez un ticket.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
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

        {/* Search by email */}
        {activeTab === 'search-email' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Visualiser les gains d'un client</Card.Title>
                <Card.Description>Recherchez un client par son nom, prénom ou email</Card.Description>
              </Card.Header>
              <form onSubmit={handleSearchCustomer} className="space-y-4">
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-tea-400">
                      {isLoadingSuggestions ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Nom, prénom ou email du client..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="input pl-12 pr-10"
                      autoComplete="off"
                    />
                    {searchEmail && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-tea-400 hover:text-tea-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-elevated border border-cream-200 overflow-hidden"
                      >
                        <ul className="py-2 max-h-64 overflow-y-auto">
                          {suggestions.map((customer, index) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectCustomer(customer)}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                                  index === selectedIndex
                                    ? 'bg-matcha-50 text-matcha-900'
                                    : 'hover:bg-cream-50'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-matcha-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-matcha-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-tea-900 truncate">
                                    {customer.fullName}
                                  </div>
                                  <div className="text-sm text-tea-500 truncate">
                                    {customer.email}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button type="submit" variant="primary" className="w-full" isLoading={isSearching} disabled={!searchEmail}>
                  Rechercher
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
                      <div key={p.id} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-gold-600" />
                          </div>
                          <div>
                            <div className="font-medium text-tea-900">{p.prize?.name}</div>
                            <div className="text-sm text-tea-600">
                              Code: <span className="font-mono">{p.ticketCode}</span> &middot; {p.prize?.value}€
                            </div>
                            <div className="text-xs text-tea-500">
                              {format(new Date(p.wonAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </div>
                          </div>
                        </div>
                        {p.status === 'won' ? (
                          <Button size="sm" variant="gold" onClick={() => handleClaimPrize(p.ticketCode)}>
                            Remettre le lot
                          </Button>
                        ) : (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Remis
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}

        {/* Search by ticket code */}
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
                <Button type="submit" variant="primary" className="w-full" isLoading={isSearching} disabled={searchCode.length !== 10}>
                  Vérifier le ticket
                </Button>
              </form>
            </Card>

            {ticketDetails && (
              <Card>
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">
                    {ticketDetails.ticket.status === 'available' ? '🎫' : ticketDetails.ticket.status === 'claimed' ? '✅' : '🎁'}
                  </div>
                  <div className="font-display font-bold text-2xl text-tea-900 mb-1">
                    {ticketDetails.ticket.prize.name}
                  </div>
                  <div className="text-gold-600 font-semibold text-lg mb-4">{ticketDetails.ticket.prize.value}€</div>

                  <div className="max-w-sm mx-auto space-y-3 text-sm">
                    <div className="flex justify-between p-3 bg-cream-50 rounded-xl">
                      <span className="text-tea-600">Code</span>
                      <span className="font-mono font-medium">{ticketDetails.ticket.code}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-cream-50 rounded-xl">
                      <span className="text-tea-600">Statut</span>
                      <span className={`font-medium ${
                        ticketDetails.ticket.status === 'claimed' ? 'text-matcha-600' :
                        ticketDetails.ticket.status === 'used' ? 'text-gold-600' :
                        ticketDetails.ticket.status === 'available' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {ticketDetails.ticket.status === 'available' ? 'Disponible' :
                         ticketDetails.ticket.status === 'used' ? 'Utilisé - À remettre' :
                         ticketDetails.ticket.status === 'claimed' ? 'Lot remis' : ticketDetails.ticket.etat}
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
      </div>
    </div>
  );
}
