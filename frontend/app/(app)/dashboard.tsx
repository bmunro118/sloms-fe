import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';

export default function DashboardScreen() {
  const { user, role } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome {user?.fullName ?? user?.username ?? 'User'}</Text>
      <Text style={styles.body}>Current role: {role}</Text>
      <Text style={styles.body}>Use the left navigation to access your allowed modules.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
  },
  body: {
    fontSize: 14,
    color: '#475569',
  },
});
