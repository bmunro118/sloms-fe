import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function ClientHome() {
  const { isAuthenticated, role, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (role !== 'client') {
    return <Redirect href="/(admin)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Interface</Text>
      <Text style={styles.subtitle}>Protected client route group</Text>

      <Pressable onPress={signOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1d4ed8',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
