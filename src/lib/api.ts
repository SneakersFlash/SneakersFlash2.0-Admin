import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'sf_access_token';
const REFRESH_TOKEN_KEY = 'sf_refresh_token';

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess: () => Cookies.get(ACCESS_TOKEN_KEY) ?? null,
  getRefresh: () => Cookies.get(REFRESH_TOKEN_KEY) ?? null,
  setTokens: (access: string, refresh: string) => {
    Cookies.set(ACCESS_TOKEN_KEY, access, {
      expires: 1,
      path: '/', // <--- TAMBAHKAN INI
      sameSite: 'lax', // <--- UBAH ke lax (strict kadang bermasalah di localhost)
      secure: process.env.NODE_ENV === 'production',
    });
    Cookies.set(REFRESH_TOKEN_KEY, refresh, {
      expires: 7,
      path: '/', // <--- TAMBAHKAN INI
      sameSite: 'lax', 
      secure: process.env.NODE_ENV === 'production',
    });
  },
  clear: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request Interceptor: Inject JWT ──────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccess();
    if (token) {
      // PERBAIKAN: Menggunakan method .set() untuk AxiosHeaders
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Auto Refresh on 401 ───────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        // PERBAIKAN: Menggunakan method .set() untuk AxiosHeaders
        originalRequest.headers.set('Authorization', `Bearer ${token}`);
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefresh } = data;
      tokenStore.setTokens(accessToken, newRefresh);
      
      // Update default headers untuk request selanjutnya
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      processQueue(null, accessToken);

      // PERBAIKAN: Menggunakan method .set() untuk AxiosHeaders
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      tokenStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

// ─── Typed error extractor ────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}