import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.150:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token
api.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<any> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }
    return Promise.reject(error);
  }
);

// ========== SERVICES CLIENT ==========
export const client = {
  getServices: () => api.get('/api/client/services'),
  getService: (id: string) => api.get(`/api/client/services/${id}`),
  getCompanies: () => api.get('/api/client/companies'),
  getCompanyServices: (companyId: string) => api.get(`/api/client/companies/${companyId}/services`),
  createTicket: (data: any) => api.post('/api/client/tickets', data),
  getTicket: (id: string) => api.get(`/api/client/tickets/${id}`),
  cancelTicket: (id: string) => api.put(`/api/client/tickets/${id}/cancel`),
  getWallet: () => api.get('/api/client/wallet'),
  getTransactions: () => api.get('/api/client/wallet/transactions'),
  deposit: (data: any) => api.post('/api/client/wallet/deposit', data),
};


export default api;