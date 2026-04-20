import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
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
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<UsersResponse>(ENDPOINTS.users.list, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setUsers(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load users.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
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
    </ScreenContent>
  );
}

const styles = StyleSheet.create({
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
