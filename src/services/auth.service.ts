import api, { tokenStore } from '@/lib/api';
import type { LoginRequest, LoginResponse, User } from '@/types/auth.types';

const AuthService = {
  /**
   * Admin login. Stores tokens in cookies on success.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);

    // Validate the user has ADMIN role
    if (data.user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin privileges required.');
    }

    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  /**
   * Fetch the currently authenticated user profile.
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  /**
   * Logout: clear all tokens.
   */
  logout(): void {
    tokenStore.clear();
  },

  /**
   * Check if a token exists (used for hydrating auth state on mount).
   */
  hasToken(): boolean {
    return !!tokenStore.getAccess();
  },
};

export default AuthService;
