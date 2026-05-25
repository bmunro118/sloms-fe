import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import {
  AuditLogEntry,
  AuditLogEventType,
  AuditLogQuery,
  getAuditLog,
} from '@src/features/users/api';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const EVENT_TYPES: AuditLogEventType[] = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGIN_LOCKED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
];

const EVENT_LABELS: Record<AuditLogEventType, string> = {
  LOGIN_SUCCESS: 'Login Success',
  LOGIN_FAILURE: 'Login Failure',
  LOGIN_LOCKED: 'Login Locked',
  ACCOUNT_LOCKED: 'Account Locked',
  ACCOUNT_UNLOCKED: 'Account Unlocked',
};

const EVENT_VARIANTS: Record<AuditLogEventType, 'success' | 'danger' | 'warning' | 'neutral'> = {
  LOGIN_SUCCESS: 'success',
  LOGIN_FAILURE: 'danger',
  LOGIN_LOCKED: 'danger',
  ACCOUNT_LOCKED: 'warning',
  ACCOUNT_UNLOCKED: 'success',
};

const PAGE_SIZE = 25;

export default function UserAuditLogScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ userId?: string }>();

  const prefilledUserId = params.userId ? Number(params.userId) : undefined;

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Active filters
  const [activeEventFilter, setActiveEventFilter] = useState<AuditLogEventType | undefined>(undefined);

  const query = useMemo<AuditLogQuery>(() => ({
    userId: prefilledUserId,
    event: activeEventFilter,
    page,
    limit: PAGE_SIZE,
  }), [prefilledUserId, activeEventFilter, page]);

  const fetchLog = useCallback(
    async (abortSignal: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAuditLog(query, { signal: abortSignal });
        if (!abortSignal.aborted) {
          setEntries(Array.isArray(response?.data) ? response.data : []);
          setTotal(response?.total ?? 0);
        }
      } catch (err) {
        if (!abortSignal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load audit log.');
        }
      } finally {
        if (!abortSignal.aborted) setIsLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    void fetchLog(controller.signal);
    return () => controller.abort();
  }, [isAdmin, fetchLog, refreshTick]);

  const handleEventFilterToggle = useCallback((event: AuditLogEventType) => {
    setActiveEventFilter((current) => (current === event ? undefined : event));
    setPage(1);
  }, []);

  const topBarActions = useMemo<TopBarAction[]>(() => [
    buildBackTopBarAction({ onPress: () => router.back() }),
    buildIconTopBarAction({
      id: 'refresh-audit',
      label: 'Refresh',
      onPress: () => setRefreshTick((t) => t + 1),
      icon: RefreshIcon,
      disabled: isLoading,
    }),
  ], [isLoading, router]);

  const title = prefilledUserId ? `Audit Log — User #${prefilledUserId}` : 'User Audit Log';
  useScreenTopBar({ title, actions: topBarActions });

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Event type filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {EVENT_TYPES.map((event) => (
            <ThemedButton
              key={event}
              label={EVENT_LABELS[event]}
              onPress={() => handleEventFilterToggle(event)}
              variant={activeEventFilter === event ? 'primary' : 'secondary'}
              style={styles.filterChip}
              tooltip={`Filter: ${EVENT_LABELS[event]}`}
            />
          ))}
        </ScrollView>

        {/* ── Results ── */}
        {isLoading ? (
          <Text style={styles.muted}>Loading audit log...</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.muted}>No audit log entries found.</Text>
        ) : (
          entries.map((entry) => (
            <AuditLogCard key={entry.id} entry={entry} />
          ))
        )}

        {/* ── Pagination ── */}
        {!isLoading && !error && totalPages > 1 ? (
          <View style={styles.pagination}>
            <ThemedButton
              label="← Prev"
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              variant="secondary"
              style={styles.pageButton}
            />
            <Text style={styles.pageLabel}>Page {page} of {totalPages}</Text>
            <ThemedButton
              label="Next →"
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              variant="secondary"
              style={styles.pageButton}
            />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContent>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AuditLogCard({ entry }: { entry: AuditLogEntry }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const variant = EVENT_VARIANTS[entry.event as AuditLogEventType] ?? 'neutral';

  const accentColor = {
    success: theme.colors.accent,
    danger: theme.colors.danger,
    warning: theme.colors.accentMuted,
    neutral: theme.colors.textSecondary,
  }[variant];

  const formattedDate = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString()
    : '—';

  return (
    <ThemedCard style={styles.card}>
      <View style={styles.auditRow}>
        <View style={[styles.eventBadge, { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}>
          <Text style={[styles.eventBadgeText, { color: accentColor }]}>
            {EVENT_LABELS[entry.event as AuditLogEventType] ?? entry.event}
          </Text>
        </View>
        <Text style={styles.auditDate}>{formattedDate}</Text>
      </View>
      {entry.username ? (
        <Text style={styles.auditMeta}>User: {entry.username}</Text>
      ) : null}
      {entry.ipAddress ? (
        <Text style={styles.auditMeta}>IP: {entry.ipAddress}</Text>
      ) : null}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.xxl,
    },
    filterRow: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    filterChip: {
      minWidth: 0,
    },
    card: common.card,
    auditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    eventBadge: {
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
    },
    eventBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    auditDate: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    auditMeta: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    pageButton: {
      minWidth: 80,
    },
    pageLabel: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });
}
