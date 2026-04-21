import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { ApiError, apiRequest } from '@utils/api';
import { usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';

interface LoginResponse {
  accessToken?: string;
  token?: string;
  mustChangePassword?: boolean;
}

export default function LoginScreen() {
  const { isAuthenticated, mustChangePassword, signIn } = useAuth();
  const isMountedRef = useIsMountedRef();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (mustChangePassword) {
    return <Redirect href="/change-password" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiRequest<LoginResponse>(ENDPOINTS.auth.login, {
        method: 'POST',
        requireAuth: false,
        body: {
          username: username.trim(),
          password,
          clientType: usesCookieAuth() ? 'web' : 'mobile',
        },
      });

      await signIn({
        accessToken: response.accessToken ?? response.token,
        mustChangePassword: response.mustChangePassword,
      });
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

  return (
    <View style={styles.container}>
      <Image
        source={require('@assets/images/branding/Sonic-Labs-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>PORTAL</Text>

      <ThemedInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Username"
        style={styles.formInput}
        value={username}
        onChangeText={setUsername}
      />
      <ThemedInput
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="Password"
        style={styles.formInput}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ThemedButton
        label={isSubmitting ? 'Signing in...' : 'Sign in'}
        disabled={isSubmitting}
        onPress={handleLogin}
        style={styles.button}
        textStyle={styles.buttonText}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
    },
    logo: {
      width: 200,
      height: 120,
      marginBottom: -27,
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
    button: {
      minWidth: 220,
      borderRadius: theme.radii.lg,
      paddingHorizontal: 20,
      paddingVertical: 14,
      marginBottom: 12,
      backgroundColor: theme.colors.accent,
    },
    buttonText: {
      textAlign: 'center',
      fontSize: 15,
    },
  });
}
