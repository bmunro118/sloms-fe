import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminHome() {
  const { isAuthenticated, role, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (role !== 'admin') {
    return <Redirect href="/(client)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Interface</Text>
      <Text style={styles.subtitle}>Protected admin route group</Text>

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
    backgroundColor: '#ecfeff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#155e75',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#0e7490',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#155e75',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
