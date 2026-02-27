'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AuthService from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';
import type { AuthContextValue, LoginRequest, User } from '@/types/auth.types';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state on mount
  useEffect(() => {
    const hydrate = async () => {
      if (!AuthService.hasToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await AuthService.getMe();
        // Only allow ADMIN role into the admin panel
        if (me.role !== 'admin') {
          AuthService.logout();
          setUser(null);
        } else {
          setUser(me);
        }
      } catch {
        AuthService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await AuthService.login(credentials);
      setUser(response.user);
      toast.success(`Selamat datang, ${response.user.name}!`);
      router.push('/dashboard');
    },
    [router],
  );

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    router.push('/login');
    toast.info('Anda telah logout.');
  }, [router]);

  // ─── Derived state ──────────────────────────────────────────────────────────

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return null; // Atau ganti dengan komponen <LoadingScreen /> jika kamu punya
  }
  
  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, isAdmin, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────


export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { getErrorMessage };
