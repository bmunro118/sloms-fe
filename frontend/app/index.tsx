import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { ApiError, apiRequest } from '@utils/api';
import { getStoredDeviceToken, usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';
import type { LoginResponse } from '@features/auth/api';

export default function LoginScreen() {
  const { isAuthenticated, mustChangePassword, signIn, beginTwoFactor } = useAuth();
  const isMountedRef = useIsMountedRef();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Bearer clients replay their persisted trusted-device token so a known
      // device can skip the 2FA challenge. Web sends the device_id cookie.
      const deviceToken = await getStoredDeviceToken();

      const response = await apiRequest<LoginResponse>(ENDPOINTS.auth.login, {
        method: 'POST',
        requireAuth: false,
        headers: deviceToken ? { 'x-device-token': deviceToken } : undefined,
        body: {
          username: username.trim().toLowerCase(),
          password,
          clientType: usesCookieAuth() ? 'web' : 'mobile',
        },
      });

      const scopedToken = response.accessToken ?? response.token ?? null;
      const method = response.twoFactorMethod ?? 'totp';
      const enteredUsername = username.trim().toLowerCase();

      switch (response.status) {
        case 'enroll':
          beginTwoFactor({ mode: 'enroll', method, token: scopedToken, username: enteredUsername });
          return;
        case '2fa':
          beginTwoFactor({ mode: 'verify', method, token: scopedToken, username: enteredUsername });
          return;
        case 'password_change':
          await signIn({ accessToken: scopedToken, mustChangePassword: true });
          return;
        case 'ok':
        default:
          // 'ok', or a legacy backend without a status field.
          await signIn({
            accessToken: scopedToken,
            mustChangePassword: response.mustChangePassword,
          });
          return;
      }
    } catch (err) {
      if (isMountedRef.current) {
        if (err instanceof ApiError && err.status === 401) {
          setError('Invalid username or password.');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Login failed. Please try again.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const isNative = Platform.OS !== 'web';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={isNative}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('@assets/images/branding/Sonic-Labs-logo.png')}
          style={[styles.logo, isNative && styles.logoNative]}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>PORTAL</Text>

        <ThemedInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Username"
          accessibilityLabel="Username"
          testID="login-username"
          style={styles.formInput}
          value={username}
          onChangeText={setUsername}
        />
        <ThemedInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Password"
          accessibilityLabel="Password"
          testID="login-password"
          style={styles.formInput}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ThemedButton
          variant="outline"
          label={isSubmitting ? 'Signing in…' : 'Sign in'}
          onPress={handleLogin}
          disabled={isSubmitting}
          style={styles.signInButton}
          tooltip={isSubmitting ? 'Signing in…' : 'Sign in'}
          testID="login-button"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    logo: {
      width: 200,
      height: 120,
      marginBottom: -27,
    },
    logoNative: {
      width: 160,
      height: 96,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginBottom: 24,
      letterSpacing: 2,
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
    signInButton: {
      minWidth: 180,
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 12,
    },
  });
}
