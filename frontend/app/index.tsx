import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { createMockToken } from '../utils/auth';

export default function LoginScreen() {
  const { isAuthenticated, role, signIn } = useAuth();

  if (isAuthenticated && role === 'admin') {
    return <Redirect href="/(admin)" />;
  }

  if (isAuthenticated && role === 'client') {
    return <Redirect href="/(client)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SLOMS Frontend</Text>
      <Text style={styles.subtitle}>Public login entrypoint</Text>

      <Pressable
        style={[styles.button, styles.adminButton]}
        onPress={() => signIn(createMockToken('admin'), 'admin')}
      >
        <Text style={styles.buttonText}>Login as Admin</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.clientButton]}
        onPress={() => signIn(createMockToken('client'), 'client')}
      >
        <Text style={styles.buttonText}>Login as Client</Text>
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
  button: {
    minWidth: 220,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
  },
  adminButton: {
    backgroundColor: '#0f766e',
  },
  clientButton: {
    backgroundColor: '#1d4ed8',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
});
