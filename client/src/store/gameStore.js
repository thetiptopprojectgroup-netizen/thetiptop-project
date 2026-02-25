import { create } from 'zustand';
import { ticketService, contestService } from '../services/api';

const useGameStore = create((set, get) => ({
  participations: [],
  prizes: [],
  contestInfo: null,
  currentWin: null,
  isLoading: false,
  isValidating: false,
  error: null,

  // Charger les informations du concours
  fetchContestInfo: async () => {
    try {
      const response = await contestService.getInfo();
      set({ contestInfo: response.data.data });
    } catch (error) {
      console.error('Erreur chargement info concours:', error);
    }
  },

  // Charger les lots disponibles
  fetchPrizes: async () => {
    try {
      const response = await ticketService.getPrizes();
      set({ prizes: response.data.data.prizes });
    } catch (error) {
      console.error('Erreur chargement des lots:', error);
    }
  },

  // Charger les participations de l'utilisateur
  fetchMyParticipations: async () => {
    set({ isLoading: true });
    try {
      const response = await ticketService.getMyParticipations();
      set({
        participations: response.data.data.participations,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Erreur chargement participations:', error);
    }
  },

  // Valider un ticket
  validateTicket: async (code) => {
    set({ isValidating: true, error: null, currentWin: null });
    try {
      const response = await ticketService.validateTicket(code);
      const participation = response.data.data.participation;
      
      set((state) => ({
        isValidating: false,
        currentWin: participation,
        participations: [participation, ...state.participations],
      }));
      
      return { success: true, data: participation };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de validation';
      set({ isValidating: false, error: message });
      return { success: false, error: message };
    }
  },

  // Vérifier un ticket (sans l'utiliser)
  checkTicket: async (code) => {
    try {
      const response = await ticketService.checkTicket(code);
      return response.data.data;
    } catch (error) {
      return { valid: false, message: 'Erreur de vérification' };
    }
  },

  // Réinitialiser le gain actuel
  clearCurrentWin: () => set({ currentWin: null }),

  // Réinitialiser l'erreur
  clearError: () => set({ error: null }),
}));

export default useGameStore;
