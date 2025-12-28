import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AxiosResponse } from 'axios';
import { toast } from 'vue-sonner';
import router from '@/router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 with auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {// Try to refresh token
        const refreshResponse = await axios.post<{ access_token: string; token_type: string }>(
          `${API_URL}/token/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        const newToken = refreshResponse.data.access_token;
        localStorage.setItem('access_token', newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        toast.error('Sesi Anda telah berakhir. Silakan login kembali.', {
          description: 'Token autentikasi tidak valid atau telah kedaluwarsa',
        });

        if (router.currentRoute.value.path !== '/login') {
          router.push('/login');
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors with toast
    if (error.response?.status === 401) {
      toast.error('Autentikasi gagal', {
        description: 'Sesi Anda telah berakhir. Silakan login kembali.',
      });
    } else if (error.response?.status === 403) {
      toast.error('Akses ditolak', {
        description: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
      });
    } else if (error.response?.status >= 500) {
      toast.error('Terjadi kesalahan server', {
        description: 'Silakan coba lagi beberapa saat.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;

