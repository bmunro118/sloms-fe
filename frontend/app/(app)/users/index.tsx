import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type UserRow = {
  id: number;
  username?: string;
  role?: string;
  fullName?: string;
};

type UserCardRow = UserRow & {
  renderKey: string;
};

type UsersResponse = {
  data?: UserRow[];
};

function resolveUserKeyBase(entry: UserRow): string {
  if (typeof entry.id === 'number' && Number.isFinite(entry.id)) {
    return `id:${entry.id}`;
  }

  if (entry.username?.trim()) {
    return `username:${entry.username.trim().toLowerCase()}`;
  }

  if (entry.fullName?.trim()) {
    return `fullname:${entry.fullName.trim().toLowerCase()}`;
  }

  return 'unknown-user';
}

function normalizeUserRows(rows: UserRow[]): UserCardRow[] {
  const keyCounts = new Map<string, number>();

  return rows.map((entry) => {
    const baseKey = resolveUserKeyBase(entry);
    const nextCount = (keyCounts.get(baseKey) ?? 0) + 1;
    keyCounts.set(baseKey, nextCount);

    return {
      ...entry,
      renderKey: nextCount === 1 ? baseKey : `${baseKey}#${nextCount}`,
    };
  });
}

export default function UsersScreen() {
  const { isAdmin } = useAuth();
  const styles = useThemedStyles(createStyles);
  useScreenTitle('Users');
  const [users, setUsers] = useState<UserCardRow[]>([]);
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
          const normalized = normalizeUserRows(Array.isArray(response?.data) ? response.data : []);
          setUsers(normalized);
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
      {isLoading ? <Text style={styles.muted}>Loading users...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && users.length === 0 ? <Text style={styles.muted}>No users found.</Text> : null}
      {users.map((entry) => (
        <ThemedCard
          key={entry.renderKey}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>{entry.fullName ?? entry.username ?? `User #${entry.id}`}</Text>
          <Text style={styles.cardMeta}>Role: {entry.role ?? 'Unknown'}</Text>
        </ThemedCard>
      ))}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
