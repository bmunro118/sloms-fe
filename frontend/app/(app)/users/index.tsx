import { Redirect } from 'expo-router';
import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { UserCard } from '@src/features/users/components/UserCard';
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
  const [refreshTick, setRefreshTick] = useState(0);
  const [users, setUsers] = useState<UserCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'refresh-users',
        label: 'Refresh users',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];
  }, [isLoading]);

  useScreenTopBar({ title: 'Users', actions: topBarActions });

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
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
  }, [isAdmin, refreshTick]);

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading users...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && users.length === 0 ? <Text style={styles.muted}>No users found.</Text> : null}
      {users.map((entry) => (
        <UserCard
          key={entry.renderKey}
          user={entry}
        />
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
