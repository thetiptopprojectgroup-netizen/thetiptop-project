import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Créer l'instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  updatePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  logout: () => api.post('/auth/logout'),
};

// Services des tickets
export const ticketService = {
  validateTicket: (code) => api.post('/tickets/validate', { code }),
  getMyParticipations: () => api.get('/tickets/my-participations'),
  getPrizes: () => api.get('/tickets/prizes'),
  checkTicket: (code) => api.get(`/tickets/check/${code}`),
};

// Services employés
export const employeeService = {
  getTicketByCode: (code) => api.get(`/tickets/code/${code}`),
  claimPrize: (code, storeLocation) => api.put(`/tickets/${code}/claim`, { storeLocation }),
  getCustomerPrizes: (email) => api.get(`/tickets/customer/${email}`),
};

// Services admin
export const adminService = {
  // Configuration du concours
  getContestConfig: () => api.get('/admin/contest-config'),
  updateContestConfig: (data) => api.put('/admin/contest-config', data),

  // Statistiques
  getStats: () => api.get('/admin/stats'),
  getGameStats: () => api.get('/admin/game-stats'),
  getAdminCodes: (params) => api.get('/admin/codes', { params }),
  getAdminCodeSamples: () => api.get('/admin/codes/samples'),
  getGameSession: () => api.get('/admin/game-session'),

  // Utilisateurs
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id, actif) => api.put(`/admin/users/${id}/status`, { actif }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUsersForEmailing: (params) => api.get('/admin/users/emailing', { params }),
  exportEmails: () => api.get('/admin/users/export', { responseType: 'blob' }),

  // Tirage
  getGrandPrize: () => api.get('/admin/grand-prize'),
  drawGrandPrize: () => api.post('/admin/grand-prize/draw'),

  // Boutiques
  getBoutiques: () => api.get('/admin/boutiques'),
  createBoutique: (data) => api.post('/admin/boutiques', data),
  updateBoutique: (id, data) => api.put(`/admin/boutiques/${id}`, data),
  deleteBoutique: (id) => api.delete(`/admin/boutiques/${id}`),

  // Employés
  getEmployees: (params) => api.get('/admin/employees', { params }),
  createEmployee: (data) => api.post('/admin/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/admin/employees/${id}`),
};

// Service d'informations du concours
export const contestService = {
  getInfo: () => api.get('/contest-info'),
  getHealth: () => api.get('/health'),
};

export default api;
