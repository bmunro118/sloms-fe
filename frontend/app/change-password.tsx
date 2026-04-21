import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { ApiError, apiRequest } from '@utils/api';
import { usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';

interface ChangePasswordResponse {
  accessToken?: string;
  token?: string;
}

export default function ChangePasswordScreen() {
  const { mustChangePassword, token, completePasswordChange, signOut } = useAuth();
  const isMountedRef = useIsMountedRef();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mustChangePassword) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleSubmit = async () => {
    if (!token && !usesCookieAuth()) {
      setError('Missing change-password token. Please sign in again.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
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
        },
      });

      await completePasswordChange(response.accessToken ?? response.token ?? null);
    } catch (err) {
      if (isMountedRef.current) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError('Your password-change session expired. Please sign in again.');
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
      <Text style={styles.title}>Password Update Required</Text>
      <Text style={styles.subtitle}>Set a new password to continue.</Text>

      <ThemedInput
        secureTextEntry
        placeholder="New password"
        style={styles.formInput}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <ThemedInput
        secureTextEntry
        placeholder="Confirm new password"
        style={styles.formInput}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ThemedButton
        label={isSubmitting ? 'Updating...' : 'Update password'}
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />

      <ThemedButton
        label="Cancel and sign out"
        variant="secondary"
        onPress={signOut}
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
