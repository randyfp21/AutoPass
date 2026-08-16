import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Dynamically construct API Base URL for Web, Mobile Emulator, Real Devices, and Production VPS
const getBaseURL = (): string => {
  // 1. Explicit Environment Variable (Production VPS / Vercel / Netlify / .env)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Running inside Native Mobile App (Android / iOS via Capacitor)
  if (Capacitor.isNativePlatform()) {
    if (import.meta.env.VITE_MOBILE_API_URL) {
      return import.meta.env.VITE_MOBILE_API_URL;
    }
    // Android Emulator loopback to host PC
    if (Capacitor.getPlatform() === 'android') {
      return 'http://10.0.2.2:8080/api/v1';
    }
    // iOS Simulator default loopback to Mac
    return 'http://localhost:8080/api/v1';
  }

  // 3. Web Browser on Local Network / Localhost
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:8080/api/v1`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Unwrap backend json wrapper { data: ... }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
