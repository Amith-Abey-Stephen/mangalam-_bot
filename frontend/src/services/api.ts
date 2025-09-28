import axios from 'axios';
import type { ChatResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mangalam-bot-backend.amithabey13.workers.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    throw error;
  }
);

export const chatAPI = {
  async sendMessage(query: string): Promise<ChatResponse> {
    try {
      const response = await api.post('/ask', { query });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async getHealth() {
    try {
      const response = await api.get('/ask/health');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  async getStats() {
    try {
      const response = await api.get('/ask/stats');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
};

export default api;