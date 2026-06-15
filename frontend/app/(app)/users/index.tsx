import { useFocusEffect, useRouter } from 'expo-router';
import { Redirect } from 'expo-router';
import { RefreshCw as RefreshIcon, UserPlus as UserPlusIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { UserCard } from '@src/features/users/components/UserCard';
import { useListFilters } from '@src/hooks/useListFilters';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type UserRow = {
  userId: number;
  username?: string;
  role?: string;
  fullName?: string;
  email?: string;
  isActive?: boolean;
  isLockedOut?: boolean;
};

type UserCardRow = UserRow & {
  renderKey: string;
};

type UsersResponse = {
  data?: UserRow[];
};

type UserFilters = {
  includeInactive: boolean;
};

function resolveUserKeyBase(entry: UserRow): string {
  if (typeof entry.userId === 'number' && Number.isFinite(entry.userId)) {
    return `id:${entry.userId}`;
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

const INITIAL_FILTERS: UserFilters = { includeInactive: false };

export default function UsersScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [refreshTick, setRefreshTick] = useState(0);
  const [users, setUsers] = useState<UserCardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    appliedFilters,
    draftFilters,
    searchQuery,
    debouncedSearch,
    isModalOpen,
    hasActiveFilters,
    setSearchQuery,
    setDraftFilter,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
  } = useListFilters<UserFilters>(INITIAL_FILTERS);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'create-user',
        label: 'Create user',
        onPress: () => router.push('/(app)/users/create' as never),
        icon: UserPlusIcon,
        disabled: isLoading,
        hidden: !isAdmin,
      }),
      buildIconTopBarAction({
        id: 'refresh-users',
        label: 'Refresh users',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];
  }, [isLoading, isAdmin, router]);

  useScreenTopBar({ title: 'Users', actions: topBarActions });

  const fetchUsers = useCallback(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return null;
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
    return controller;
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      const controller = fetchUsers();
      return () => {
        controller?.abort();
      };
    }, [fetchUsers, refreshTick])
  );

  const usersByFilter = appliedFilters.includeInactive
    ? users
    : users.filter((u) => u.isActive !== false);

  const filteredUsers = debouncedSearch.trim()
    ? usersByFilter.filter((u) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          (u.username?.toLowerCase().includes(q) ?? false) ||
          (u.fullName?.toLowerCase().includes(q) ?? false) ||
          (u.role?.toLowerCase().includes(q) ?? false)
        );
      })
    : usersByFilter;

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <>
      <ScreenContent>
        <ListFilterHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={openModal}
          hasActiveFilters={hasActiveFilters}
          placeholder="Search users..."
        />

        {isLoading ? <Text style={styles.muted}>Loading users...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && filteredUsers.length === 0 ? <Text style={styles.muted}>No users found.</Text> : null}
        {filteredUsers.map((entry) => (
          <UserCard
            key={entry.renderKey}
            user={entry}
          />
        ))}
      </ScreenContent>

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Users"
      >
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.colors.textPrimary }}>Include inactive accounts</Text>
          <Switch
            value={draftFilters.includeInactive}
            onValueChange={(val) => setDraftFilter('includeInactive', val)}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </FilterModal>
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
