import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAccessToken, decodeRoleFromToken, getStoredAccessToken, persistAccessToken } from '../../utils/auth';

type UserRole = 'admin' | 'client';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  token: string | null;
  signIn: (token: string, fallbackRole?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = await getStoredAccessToken();
      const derivedRole = decodeRoleFromToken(storedToken);

      setToken(storedToken);
      setRole(derivedRole);
      setIsLoading(false);
    }

    bootstrap();
  }, []);

  const signIn = useCallback(async (nextToken: string, fallbackRole: UserRole = 'client') => {
    await persistAccessToken(nextToken);

    setToken(nextToken);
    setRole(decodeRoleFromToken(nextToken) ?? fallbackRole);
  }, []);

  const signOut = useCallback(async () => {
    await clearAccessToken();
    setToken(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(token),
      role,
      token,
      signIn,
      signOut,
    }),
    [isLoading, role, token, signIn, signOut]
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
