import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { ApiError, apiRequest } from '@utils/api';
import { usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface ChangePasswordResponse {
  accessToken?: string;
  token?: string;
  message?: string;
  error?: string;
  code?: string;
}

const SAME_AS_CURRENT_HINT = 'same as current';

function containsSameAsCurrent(...parts: Array<string | null | undefined>): boolean {
  return parts.join(' ').toLowerCase().includes(SAME_AS_CURRENT_HINT);
}

// The SLOMS backend rejects a new password identical to the current one. Some
// deployments signal this with a 400 (detail surfaced on `ApiError.code`, since
// the user-facing `message` is a generic status string); others return a 200
// whose body carries a "same as current" message and NO new access token. Both
// paths must be detected so the user is prompted for a different password.
function isSameAsCurrentError(err: ApiError): boolean {
  return containsSameAsCurrent(err.code, err.message);
}

function isSameAsCurrentResponse(response: ChangePasswordResponse): boolean {
  return containsSameAsCurrent(response.message, response.error, response.code);
}

export default function PromptPasswordChangeScreen() {
  const { mustChangePassword, token, completePasswordChange, signOut } = useAuth();
  const isMountedRef = useIsMountedRef();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(async () => {
      if (isMountedRef.current) {
        await signOut();
        router.replace('/');
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [signOut, router, isMountedRef]);

  // Set up the inactivity timer and attach window-level interaction listeners on web
  useEffect(() => {
    resetInactivityTimer();

    const interactionEvents = ['mousedown', 'touchstart', 'keydown', 'scroll'] as const;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      for (const event of interactionEvents) {
        window.addEventListener(event, resetInactivityTimer);
      }
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        for (const event of interactionEvents) {
          window.removeEventListener(event, resetInactivityTimer);
        }
      }
    };
  }, [resetInactivityTimer]);

  const handleSubmit = async () => {
    resetInactivityTimer();

    const promptForDifferentPassword = () => {
      setNewPassword('');
      setConfirmPassword('');
      setError('New password must be different from your current password. Please choose a different one.');
    };

    if (!token && !usesCookieAuth()) {
      setError('Missing password-change token. Please sign in again.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiRequest<ChangePasswordResponse>(ENDPOINTS.auth.changePassword, {
        method: 'POST',
        requireAuth: true,
        token: usesCookieAuth() ? undefined : (token ?? undefined),
        body: {
          newPassword,
          clientType: usesCookieAuth() ? 'web' : 'mobile',
        },
      });

      // The backend may accept the request (HTTP 200) yet signal "same as
      // current" in the body without issuing a new token. Detect that before
      // completing — otherwise completePasswordChange(null) would fall back to
      // hydrating a full session from the stored password-change-scoped token,
      // logging the user straight in with their old password unchanged.
      if (isSameAsCurrentResponse(response)) {
        promptForDifferentPassword();
        return;
      }

      const newToken = response.accessToken ?? response.token ?? null;

      // Token-auth clients must receive a fresh full-access token on success. A
      // missing token means the password was not actually changed, so we must
      // not hydrate from the stale scoped token.
      if (!usesCookieAuth() && !newToken) {
        promptForDifferentPassword();
        return;
      }

      await completePasswordChange(newToken);
    } catch (err) {
      if (isMountedRef.current) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError('Your password-change session expired. Please sign in again.');
        } else if (err instanceof ApiError && err.status === 400) {
          // The backend's raw detail is surfaced on `err.code`; `err.message`
          // is a generic status string. Detect the "same as current" rejection
          // so the user is clearly prompted to choose a different password.
          if (isSameAsCurrentError(err)) {
            promptForDifferentPassword();
          } else {
            setError(err.code ?? err.message);
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to change password.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>First-Time Password Setup</Text>
      <Text style={styles.subtitle}>Your account requires a new password before you can access the portal. Choose a new password that is different from your temporary one.</Text>

      <ThemedInput
        secureTextEntry
        placeholder="New password"
        style={styles.formInput}
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          resetInactivityTimer();
        }}
      />
      <ThemedInput
        secureTextEntry
        placeholder="Confirm new password"
        style={styles.formInput}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          resetInactivityTimer();
        }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ThemedButton
        label={isSubmitting ? 'Updating...' : 'Update password'}
        disabled={isSubmitting}
        onPress={() => {
          resetInactivityTimer();
          handleSubmit();
        }}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />

      <ThemedButton
        label="Cancel and sign out"
        variant="secondary"
        onPress={() => {
          resetInactivityTimer();
          signOut();
        }}
        style={styles.secondaryButton}
        textStyle={styles.secondaryButtonText}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textMuted,
      marginBottom: 20,
      textAlign: 'center',
    },
    formInput: {
      width: '100%',
      maxWidth: 360,
      marginBottom: 10,
      fontSize: 15,
    },
    errorText: {
      color: theme.colors.danger,
      marginBottom: 10,
      maxWidth: 360,
      textAlign: 'center',
    },
    primaryButton: {
      width: '100%',
      maxWidth: 360,
      marginBottom: 10,
    },
    primaryButtonText: {
      fontSize: 14,
    },
    secondaryButton: {
      width: '100%',
      maxWidth: 360,
    },
    secondaryButtonText: {
      fontWeight: '600',
    },
  });
}
