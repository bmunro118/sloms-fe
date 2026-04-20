import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { ApiError, apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

interface LoginResponse {
  accessToken: string;
  mustChangePassword?: boolean;
}

export default function LoginScreen() {
  const { isAuthenticated, mustChangePassword, signIn } = useAuth();
  const isMountedRef = useIsMountedRef();
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
        },
      });

      await signIn({
        accessToken: response.accessToken,
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
      <Text style={styles.title}>SLOMS Frontend</Text>
      <Text style={styles.subtitle}>Login with your API credentials</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Username"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
        disabled={isSubmitting}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
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
  button: {
    minWidth: 220,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#0f766e',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
});
