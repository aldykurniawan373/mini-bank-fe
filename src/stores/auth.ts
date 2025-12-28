import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { authService } from '@/services/auth.service';
import type { User, LoginRequest } from '@/types/auth';
import router from '@/router';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    isAdmin: (state): boolean => {
      return state.user?.role === 'admin';
    },
    isPimpinan: (state): boolean => {
      return state.user?.role === 'pimpinan';
    },
  },

  actions: {
    // Initialize auth from localStorage
    async initAuth() {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      if (token && userStr) {
        try {
          this.token = token;
          this.user = JSON.parse(userStr);
          this.isAuthenticated = true;
          
          // Fetch fresh user data from server
          await this.getMe();
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          this.logout();
        }
      }
    },

    // Login action
    async login(credentials: LoginRequest): Promise<void> {
      this.isLoading = true;
      try {
        const response = await authService.login(credentials);
        
        // Store token and user (response is direct, not wrapped in data)
        this.token = response.access_token;
        this.user = response.user;
        this.isAuthenticated = true;

        localStorage.setItem(TOKEN_KEY, this.token);
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));

        // Show success toast
        toast.success('Login berhasil', {
          description: `Selamat datang, ${this.user?.name || 'User'}!`,
        });

        // Redirect to dashboard
        router.push('/dashboard/home');
      } catch (error: unknown) {
        console.error('Login error:', error);
        const axiosError = error as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Login gagal';
        
        // Show error toast
        toast.error('Login gagal', {
          description: errorMessage,
        });
        
        throw new Error(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    // Logout action
    async logout(): Promise<void> {
      try {
        if (this.token) {
          await authService.logout();
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear state and storage
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        toast.success('Logout berhasil', {
          description: 'Anda telah keluar dari sistem',
        });

        router.push('/login');
      }
    },

    async refreshToken(): Promise<void> {
      try {
        const response = await authService.refresh();
        this.token = response.access_token;
        localStorage.setItem(TOKEN_KEY, this.token);
      } catch (error) {
        console.error('Refresh token error:', error);
        this.logout();
      }
    },


    async getMe(): Promise<void> {
      try {
        const user = await authService.me();
        this.user = user;
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      } catch (error) {
        console.error('Get me error:', error);
        this.logout();
      }
    },
  },
});

