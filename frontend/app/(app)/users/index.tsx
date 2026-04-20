import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type UserRow = {
  id: number;
  username?: string;
  role?: string;
  fullName?: string;
};

type UsersResponse = {
  data?: UserRow[];
};

export default function UsersScreen() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<UsersResponse>(ENDPOINTS.users.list, {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) {
          setUsers(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load users.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users</Text>
      {isLoading ? <Text style={styles.muted}>Loading users...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && users.length === 0 ? <Text style={styles.muted}>No users found.</Text> : null}
      {users.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <Text style={styles.cardTitle}>{entry.fullName ?? entry.username ?? `User #${entry.id}`}</Text>
          <Text style={styles.cardMeta}>Role: {entry.role ?? 'Unknown'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  muted: {
    color: '#64748b',
  },
  error: {
    color: '#b91c1c',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cardMeta: {
    color: '#475569',
    marginTop: 4,
  },
});
