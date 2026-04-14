import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          const { user, token } = response.data.data;
          
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur de connexion';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      loginWithGoogleCredential: async (credential) => {
        set({ error: null });
        try {
          const response = await authService.loginWithGoogleCredential(credential);
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          set({
            user,
            token,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur de connexion Google';
          set({ error: message });
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          const { user, token } = response.data.data;
          
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur d\'inscription';
          const errors = error.response?.data?.errors;
          set({ error: message, isLoading: false });
          return { success: false, error: message, errors };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      deleteAccount: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.deleteAccount(payload);
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Impossible de supprimer le compte';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getMe();
          set({
            user: response.data.data.user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updateProfile(data);
          set({
            user: response.data.data.user,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur de mise à jour';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
              clear: () => {},
              get length() {
                return 0;
              },
              key: () => null,
            }
      ),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
