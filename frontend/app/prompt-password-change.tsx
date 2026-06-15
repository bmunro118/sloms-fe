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
}

export default function PromptPasswordChangeScreen() {
  const { mustChangePassword, token, completePasswordChange, signOut } = useAuth();
  const isMountedRef = useIsMountedRef();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
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

    if (!token && !usesCookieAuth()) {
      setError('Missing password-change token. Please sign in again.');
      return;
    }

    if (!currentPassword) {
      setError('Please enter your current (temporary) password.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
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

      await completePasswordChange(response.accessToken ?? response.token ?? null);
    } catch (err) {
      if (isMountedRef.current) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError('Your password-change session expired. Please sign in again.');
        } else if (err instanceof ApiError && err.status === 400) {
          setError(
            err.message?.toLowerCase().includes('same as current')
              ? 'New password must be different from your current password.'
              : err.message
          );
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
      <Text style={styles.subtitle}>Your account requires a new password before you can access the portal. Enter your temporary password and choose a different new password.</Text>

      <ThemedInput
        secureTextEntry
        placeholder="Current (temporary) password"
        style={styles.formInput}
        value={currentPassword}
        onChangeText={(text) => {
          setCurrentPassword(text);
          resetInactivityTimer();
        }}
      />
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
