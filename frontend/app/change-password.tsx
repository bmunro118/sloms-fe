import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
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

      <TextInput
        secureTextEntry
        placeholder="New password"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        secureTextEntry
        placeholder="Confirm new password"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryButton, isSubmitting ? styles.disabled : null]}
        disabled={isSubmitting}
        onPress={handleSubmit}
      >
        <Text style={styles.primaryButtonText}>{isSubmitting ? 'Updating...' : 'Update password'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={signOut}>
        <Text style={styles.secondaryButtonText}>Cancel and sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 10,
    maxWidth: 360,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.65,
  },
});
