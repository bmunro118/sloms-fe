import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { ENDPOINTS } from '../../utils/config';
import { clearAccessToken, decodeJwt, getStoredAccessToken, persistAccessToken } from '../../utils/auth';

export type UserRole = 'Admin' | 'Manager' | 'Operative' | 'ReadOnly' | 'Customer';

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
}

interface SignInPayload {
  accessToken: string;
  mustChangePassword?: boolean;
}

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  role: UserRole | null;
  user: AuthUser | null;
  token: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  canMutate: boolean;
  hydrateSession: () => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  completePasswordChange: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const mapRole = useCallback((rawRole: string | undefined): UserRole => {
    switch ((rawRole ?? '').toLowerCase()) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'operative':
        return 'Operative';
      case 'readonly':
      case 'read_only':
      case 'read-only':
        return 'ReadOnly';
      default:
        return 'Customer';
    }
  }, []);

  const hydrateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = await getStoredAccessToken();
      if (!storedToken) {
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        return;
      }

      const payload = decodeJwt(storedToken);
      if (!payload) {
        await clearAccessToken();
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        return;
      }

      // If token is scoped for forced password change, block app access.
      if (payload.scope === 'password_change') {
        setToken(storedToken);
        setUser(null);
        setMustChangePassword(true);
        return;
      }

      // Validate token by asking backend for current session identity.
      const me = await apiRequest<{ userId: number; username: string; role: string }>(ENDPOINTS.auth.me, {
        method: 'GET',
        requireAuth: true,
        token: storedToken,
      });

      setToken(storedToken);
      setUser({
        userId: Number(me.userId ?? payload.userId),
        username: me.username ?? payload.username,
        fullName: payload.fullName ?? me.username,
        role: mapRole(me.role ?? payload.role),
      });
      setMustChangePassword(false);
    } catch {
      await clearAccessToken();
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    } finally {
      setIsLoading(false);
    }
  }, [mapRole]);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  const signIn = useCallback(
    async ({ accessToken, mustChangePassword: mustChange = false }: SignInPayload) => {
      await persistAccessToken(accessToken);
      setToken(accessToken);

      const payload = decodeJwt(accessToken);
      if (!payload) {
        throw new Error('Invalid access token received from API.');
      }

      if (mustChange || payload.scope === 'password_change') {
        setMustChangePassword(true);
        setUser(null);
        return;
      }

      setMustChangePassword(false);
      setUser({
        userId: Number(payload.userId),
        username: payload.username,
        fullName: payload.fullName ?? payload.username,
        role: mapRole(payload.role),
      });
    },
    [mapRole]
  );

  const completePasswordChange = useCallback(
    async (newAccessToken: string) => {
      await persistAccessToken(newAccessToken);
      const payload = decodeJwt(newAccessToken);
      if (!payload) {
        throw new Error('Invalid full-access token returned after password change.');
      }

      setToken(newAccessToken);
      setUser({
        userId: Number(payload.userId),
        username: payload.username,
        fullName: payload.fullName ?? payload.username,
        role: mapRole(payload.role),
      });
      setMustChangePassword(false);
    },
    [mapRole]
  );

  const signOut = useCallback(async () => {
    await clearAccessToken();
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const role = user?.role ?? null;
  const isStaff = role !== null && role !== 'Customer';
  const isAdmin = role === 'Admin';
  const canMutate = role !== null && role !== 'ReadOnly' && role !== 'Customer';

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(token) && !mustChangePassword,
      mustChangePassword,
      role,
      user,
      token,
      isStaff,
      isAdmin,
      canMutate,
      hydrateSession,
      signIn,
      completePasswordChange,
      signOut,
    }),
    [
      isLoading,
      mustChangePassword,
      role,
      user,
      token,
      isStaff,
      isAdmin,
      canMutate,
      hydrateSession,
      signIn,
      completePasswordChange,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
