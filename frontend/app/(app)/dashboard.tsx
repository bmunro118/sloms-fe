import { StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';

export default function DashboardScreen() {
  const { user, role } = useAuth();

  return (
    <ScreenContent gap={8}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome {user?.fullName ?? user?.username ?? 'User'}</Text>
      <Text style={styles.body}>Current role: {role}</Text>
      <Text style={styles.body}>Use the left navigation to access your allowed modules.</Text>
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
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
