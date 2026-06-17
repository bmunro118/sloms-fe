import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { apiRequest, clearUnauthorizedHandler, setUnauthorizedHandler } from '@utils/api';
import { ENDPOINTS } from '@utils/config';
import {
  JwtPayload,
  clearAccessToken,
  decodeJwt,
  getStoredAccessToken,
  getStoredAccessTokenSnapshot,
  persistAccessToken,
  usesCookieAuth,
} from '@utils/auth';
import { featureFlags } from '@utils/features';

export type UserRole = 'Admin' | 'Manager' | 'Operative' | 'ReadOnly' | 'Customer';

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
}

interface SignInPayload {
  accessToken?: string | null;
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
  completePasswordChange: (accessToken?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface InitialAuthSnapshot {
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  mustChangePassword: boolean;
}

type AuthState = InitialAuthSnapshot;

function mapRole(rawRole: string | undefined): UserRole {
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
}

function mapPayloadUser(payload: JwtPayload): AuthUser {
  return {
    userId: Number(payload.sub),
    username: payload.username,
    fullName: payload.fullName ?? payload.username,
    role: mapRole(payload.role),
  };
}

function getInitialAuthSnapshot(): InitialAuthSnapshot {
  if (usesCookieAuth()) {
    return {
      isLoading: true,
      token: null,
      user: null,
      mustChangePassword: false,
    };
  }

  const token = getStoredAccessTokenSnapshot();

  // Native storage is async only, so bootstrap waits for hydrateSession once.
  if (!token) {
    return {
      isLoading: Platform.OS !== 'web',
      token: null,
      user: null,
      mustChangePassword: false,
    };
  }

  const payload = decodeJwt(token);
  if (!payload) {
    return {
      isLoading: false,
      token: null,
      user: null,
      mustChangePassword: false,
    };
  }

  if (payload.scope === 'password_change') {
    return {
      isLoading: false,
      token,
      user: mapPayloadUser(payload),
      mustChangePassword: true,
    };
  }

  return {
    isLoading: false,
    token,
    user: mapPayloadUser(payload),
    mustChangePassword: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => getInitialAuthSnapshot());
  const authSequenceRef = useRef(0);

  const bumpAuthSequence = useCallback(() => {
    authSequenceRef.current += 1;
    return authSequenceRef.current;
  }, []);

  const setSignedOutState = useCallback(() => {
    setAuthState({
      isLoading: false,
      token: null,
      user: null,
      mustChangePassword: false,
    });
  }, []);

  const hydrateSession = useCallback(async () => {
    const sequenceId = bumpAuthSequence();

    try {
      const storedToken = await getStoredAccessToken();
      if (!storedToken && !usesCookieAuth()) {
        if (authSequenceRef.current !== sequenceId) return;
        setSignedOutState();
        return;
      }

      const payload = storedToken ? decodeJwt(storedToken) : null;
      if (storedToken && !payload) {
        if (authSequenceRef.current !== sequenceId) return;
        await clearAccessToken();
        setSignedOutState();
        return;
      }

      // If token is scoped for forced password change, block app access.
      if (payload?.scope === 'password_change') {
        if (authSequenceRef.current !== sequenceId) return;
        setAuthState({
          isLoading: false,
          token: storedToken,
          user: mapPayloadUser(payload),
          mustChangePassword: true,
        });
        return;
      }

      // Validate token by asking backend for current session identity.
      const me = await apiRequest<{ userId: number; username: string; role: string }>(ENDPOINTS.auth.me, {
        method: 'GET',
        requireAuth: true,
        token: usesCookieAuth() ? undefined : (storedToken ?? undefined),
      });

      if (authSequenceRef.current !== sequenceId) return;
      setAuthState({
        isLoading: false,
        token: storedToken,
        user: {
          userId: Number(me.userId ?? payload?.sub),
          username: me.username ?? payload?.username ?? '',
          fullName: payload?.fullName ?? me.username,
          role: mapRole(me.role ?? payload?.role),
        },
        mustChangePassword: false,
      });
    } catch {
      if (authSequenceRef.current !== sequenceId) return;
      await clearAccessToken();
      setSignedOutState();
    }
  }, [bumpAuthSequence, setSignedOutState]);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  // Register a global 401 handler so any authenticated API call that receives
  // Unauthorized automatically clears the session and returns to login.
  // The handler is unregistered on unmount to prevent stale closures.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      bumpAuthSequence();
      await clearAccessToken();
      setSignedOutState();
    });
    return () => {
      clearUnauthorizedHandler();
    };
  }, [bumpAuthSequence, setSignedOutState]);

  const signIn = useCallback(
    async ({ accessToken, mustChangePassword: mustChange = false }: SignInPayload) => {
      bumpAuthSequence();
      await persistAccessToken(accessToken);

      const payload = accessToken ? decodeJwt(accessToken) : null;
      if (accessToken && !payload) {
        throw new Error('Invalid access token received from API.');
      }

      if (mustChange || payload?.scope === 'password_change') {
        setAuthState({
          isLoading: false,
          token: accessToken ?? null,
          user: payload ? mapPayloadUser(payload) : null,
          mustChangePassword: true,
        });
        return;
      }

      if (!payload) {
        await hydrateSession();
        return;
      }

      setAuthState({
        isLoading: false,
        token: accessToken ?? null,
        user: {
          userId: Number(payload.sub),
          username: payload.username,
          fullName: payload.fullName ?? payload.username,
          role: mapRole(payload.role),
        },
        mustChangePassword: false,
      });
    },
    [bumpAuthSequence, hydrateSession]
  );

  const completePasswordChange = useCallback(
    async (newAccessToken?: string | null) => {
      bumpAuthSequence();

      if (!newAccessToken) {
        await hydrateSession();
        return;
      }

      await persistAccessToken(newAccessToken);
      const payload = decodeJwt(newAccessToken);
      if (!payload) {
        throw new Error('Invalid full-access token returned after password change.');
      }

      setAuthState({
        isLoading: false,
        token: newAccessToken,
        user: {
          userId: Number(payload.sub),
          username: payload.username,
          fullName: payload.fullName ?? payload.username,
          role: mapRole(payload.role),
        },
        mustChangePassword: false,
      });
    },
    [bumpAuthSequence, hydrateSession]
  );

  const signOut = useCallback(async () => {
    bumpAuthSequence();
    await clearAccessToken();
    setSignedOutState();
  }, [bumpAuthSequence, setSignedOutState]);

  const { isLoading, token, user, mustChangePassword } = authState;

  const role = user?.role ?? null;
  const isStaff = role !== null && role !== 'Customer';
  const isAdmin = role === 'Admin';
  const isCustomerReadOnly =
    role === 'Customer' && featureFlags.allCustomersReadOnly;
  const canMutate = role !== null && role !== 'ReadOnly' && !isCustomerReadOnly;

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null && !mustChangePassword,
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
