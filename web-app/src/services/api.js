import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ========== SERVICES AUTH ==========
export const auth = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),  // ✅ POUR ADMIN ENTREPRISE
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  verifyResetToken: (token) => api.get('/api/auth/verify-reset-token', { params: { token } }),
};

// ========== SERVICES SUPER ADMIN ==========
export const superAdmin = {
  changePassword: (data) => api.put('/api/auth/change-password', data),  // ✅ POUR SUPER ADMIN
  getCompanies: () => api.get('/api/admin/companies'),
  getCompany: (id) => api.get(`/api/admin/companies/${id}`),
  createCompany: (data) => api.post('/api/admin/companies', data),
  updateCompany: (id, data) => api.put(`/api/admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/api/admin/companies/${id}`),
  getUsers: () => api.get('/api/admin/users'),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  suspendUser: (id) => api.put(`/api/admin/users/${id}/suspend`),
  activateUser: (id) => api.put(`/api/admin/users/${id}/activate`),
  getStats: () => api.get('/api/admin/stats'),
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data) => api.put('/api/admin/settings', data),
  getCompanyAgents: (companyId) => api.get(`/api/admin/companies/${companyId}/agents`),
  getCompanyServices: (companyId) => api.get(`/api/admin/companies/${companyId}/services`),
  getTransactions: (params) => api.get('/api/admin/transactions', { params }),
  getTransaction: (id) => api.get(`/api/admin/transactions/${id}`),
  exportTransactions: (params) => api.get('/api/admin/transactions/export', { 
    params, 
    responseType: 'blob' 
  }),
  exportReport: (params) => api.get('/api/admin/reports/export', { 
    params, 
    responseType: 'blob' 
  }),
  getQueues: () => api.get('/api/admin/queues'),
  getQueue: (id) => api.get(`/api/admin/queues/${id}`),
};

// ========== SERVICES COMPANY ADMIN ==========
export const companyAdmin = {
  getStats: () => api.get('/api/company/stats'),
  getServices: () => api.get('/api/company/services'),
  getService: (id) => api.get(`/api/company/services/${id}`),
  createService: (data) => api.post('/api/company/services', data),
  updateService: (id, data) => api.put(`/api/company/services/${id}`, data),
  deleteService: (id) => api.delete(`/api/company/services/${id}`),
  getAgents: () => api.get('/api/company/agents'),
  getCompanySettings: () => api.get('/api/company/settings'),
  updateCompanySettings: (data) => api.put('/api/company/settings', data),
  getAgent: (id) => api.get(`/api/company/agents/${id}`),
  getAgentStats: () => api.get('/api/company/agent/stats'),
  getAgentServices: () => api.get('/api/company/agent/services'),
  getAgentRecentActivity: () => api.get('/api/company/agent/recent-activity'),
  updateAgentProfile: (data) => api.put('/api/company/agent/profile', data),
  getAdvancedStats: (params) => api.get('/api/company/advanced-stats', { params }),
  createAgent: (data) => api.post('/api/company/agents', data),
  updateAgent: (id, data) => api.put(`/api/company/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/api/company/agents/${id}`),
  getServicesWithStats: () => api.get('/api/company/services-with-stats'),
  getTransactions: (params) => api.get('/api/company/transactions', { params }),
  exportTransactions: (params) => api.get('/api/company/transactions/export', { 
    params, 
    responseType: 'blob' 
  }),
};

// ========== SERVICES AGENT ==========
export const agent = {
  getQueueStatus: (serviceId) => api.get(`/api/company/agent/queue/${serviceId}/status`),
  getQueueSlotStatus: (serviceId) => api.get(`/api/company/agent/queue-slot/${serviceId}/status`),
  callSlotNext: (ticketId) => api.post(`/api/company/agent/queue-slot/${ticketId}/call`),
  callNext: (serviceId) => api.post(`/api/company/agent/queue/${serviceId}/call-next`),
  completeTicket: (ticketId) => api.put(`/api/company/agent/tickets/${ticketId}/complete`),
  cancelTicket: (ticketId, data) => api.put(`/api/company/agent/tickets/${ticketId}/cancel`, data),
  getHistory: (params) => api.get('/api/company/agent/history', { params }),
  exportHistory: (params) => api.get('/api/company/agent/history/export', { 
        params, 
        responseType: 'blob' 
    }),
};

// ========== SERVICES CLIENT ==========
export const client = {
  getCompanies: (params) => api.get('/api/client/companies', { params }),
  getServices: (params) => api.get('/api/client/services', { params }),
  getService: (id) => api.get(`/api/client/services/${id}`),
  createTicket: (data) => api.post('/api/client/tickets', data),
  getTickets: () => api.get('/api/client/tickets'),
  getTicket: (id) => api.get(`/api/client/tickets/${id}`),
  cancelTicket: (id) => api.put(`/api/client/tickets/${id}/cancel`),
  getWallet: () => api.get('/api/client/wallet'),
  deposit: (data) => api.post('/api/client/wallet/deposit', data),
  getTransactions: () => api.get('/api/client/wallet/transactions'),
  getQueue: (id) => api.get(`/api/admin/queues/${id}`),
};