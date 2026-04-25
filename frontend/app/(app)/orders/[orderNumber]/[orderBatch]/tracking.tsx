import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Factory,
  Filter,
  Package,
  RefreshCw as RefreshIcon,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { getOrderTracking } from '@src/features/orders/api';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

type TrackingEntry = {
  timestamp?: string;
  changedOn?: string;
  status?: string;
  note?: string;
  message?: string;
  [key: string]: unknown;
};

type TrackingItem = {
  serialNumber?: string;
  description?: string;
  side?: string;
  status?: string;
  [key: string]: unknown;
};

type OrderTrackingPayload = {
  orderNumber?: number;
  orderBatch?: number;
  customerRef?: string;
  status?: string;
  currentStatus?: string;
  statusChangedOn?: string;
  history?: TrackingEntry[];
  items?: TrackingItem[];
  itemProgress?: unknown;
  [key: string]: unknown;
};

type TimelineUpdate = {
  id: string;
  status: string;
  statusLabel: string;
  timestamp?: string;
  timestampLabel: string;
  note?: string;
  message?: string;
};

type FilterOption = {
  label: string;
  value: string;
};

type StepState = 'complete' | 'current' | 'upcoming';

const ORDER_STEPS = ['Received', 'InProduction', 'Ready', 'Dispatched'] as const;

function formatTrackingDate(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatStatusLabel(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function normalizeTrackingTimestamp(entry: TrackingEntry): string | undefined {
  if (typeof entry.changedOn === 'string' && entry.changedOn.trim().length > 0) {
    return entry.changedOn;
  }

  if (typeof entry.timestamp === 'string' && entry.timestamp.trim().length > 0) {
    return entry.timestamp;
  }

  return undefined;
}

function getStatusIcon(status?: string): LucideIcon {
  switch (status) {
    case 'Received':
      return Package;
    case 'InProduction':
      return Factory;
    case 'Ready':
      return CheckCircle2;
    case 'Dispatched':
      return Truck;
    case 'Voided':
      return AlertTriangle;
    default:
      return Clock3;
  }
}

export default function OrderTrackingScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string }>();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);

  const [tracking, setTracking] = useState<OrderTrackingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  const loadTracking = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setError('Invalid order route parameters.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrderTracking<OrderTrackingPayload>(orderNumber, orderBatch, { signal });
      if (!signal?.aborted) {
        setTracking(response);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load tracking.');
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [orderBatch, orderNumber]);

  useEffect(() => {
    const controller = new AbortController();
    void loadTracking(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTracking]);

  const historyEntries = useMemo(() => {
    return Array.isArray(tracking?.history) ? tracking.history : [];
  }, [tracking?.history]);

  const items = useMemo(() => {
    return Array.isArray(tracking?.items) ? tracking.items : [];
  }, [tracking?.items]);

  const currentStatus = useMemo(() => {
    return tracking?.currentStatus ?? tracking?.status ?? 'Unknown';
  }, [tracking?.currentStatus, tracking?.status]);

  const updates = useMemo<TimelineUpdate[]>(() => {
    return historyEntries
      .map((entry, index) => {
        const timestamp = normalizeTrackingTimestamp(entry);
        const status = entry.status ?? 'Unknown';

        return {
          id: `${timestamp ?? 'unknown'}-${index}`,
          status,
          statusLabel: formatStatusLabel(status),
          timestamp,
          timestampLabel: formatTrackingDate(timestamp),
          note: typeof entry.note === 'string' ? entry.note : undefined,
          message: typeof entry.message === 'string' ? entry.message : undefined,
        };
      })
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : Number.NEGATIVE_INFINITY;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : Number.NEGATIVE_INFINITY;
        return bTime - aTime;
      });
  }, [historyEntries]);

  const updateFilterOptions = useMemo<FilterOption[]>(() => {
    const statuses = Array.from(new Set(updates.map((entry) => entry.status).filter(Boolean)));

    return [
      { label: 'All updates', value: 'all' },
      ...statuses.map((status) => ({
        label: formatStatusLabel(status),
        value: status,
      })),
    ];
  }, [updates]);

  const filteredUpdates = useMemo(() => {
    if (selectedStatusFilter === 'all') {
      return updates;
    }

    return updates.filter((entry) => entry.status === selectedStatusFilter);
  }, [selectedStatusFilter, updates]);

  const lastUpdateTimestamp = useMemo(() => {
    if (updates.length > 0) {
      return updates[0].timestamp;
    }

    if (typeof tracking?.statusChangedOn === 'string' && tracking.statusChangedOn.trim().length > 0) {
      return tracking.statusChangedOn;
    }

    return undefined;
  }, [tracking?.statusChangedOn, updates]);

  const itemStatuses = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((entry) => (typeof entry.status === 'string' ? entry.status : undefined))
          .filter((status): status is string => Boolean(status))
      )
    );
  }, [items]);

  const detectedProblems = useMemo(() => {
    const checks: Array<{ id: string; level: 'ok' | 'warn'; message: string }> = [];
    const latestStatus = updates[0]?.status;

    if (latestStatus && currentStatus !== 'Unknown' && latestStatus !== currentStatus) {
      checks.push({
        id: 'latest-mismatch',
        level: 'warn',
        message: `Latest update is ${formatStatusLabel(latestStatus)} but current status is ${formatStatusLabel(currentStatus)}.`,
      });
    }

    if (itemStatuses.length > 1) {
      checks.push({
        id: 'mixed-item-statuses',
        level: 'warn',
        message: `Items have mixed statuses: ${itemStatuses.map((status) => formatStatusLabel(status)).join(', ')}.`,
      });
    }

    if (itemStatuses.length === 1 && currentStatus !== 'Unknown' && itemStatuses[0] !== currentStatus) {
      checks.push({
        id: 'item-order-mismatch',
        level: 'warn',
        message: `All items are ${formatStatusLabel(itemStatuses[0])} while order status is ${formatStatusLabel(currentStatus)}.`,
      });
    }

    if (!lastUpdateTimestamp) {
      checks.push({
        id: 'missing-updates',
        level: 'warn',
        message: 'No timestamped updates found for this order.',
      });
    }

    if (checks.length === 0) {
      checks.push({
        id: 'all-clear',
        level: 'ok',
        message: 'No consistency issues detected between order status, updates, and items.',
      });
    }

    return checks;
  }, [currentStatus, itemStatuses, lastUpdateTimestamp, updates]);

  const journeySteps = useMemo(() => {
    const effectiveStatus = currentStatus !== 'Unknown' ? currentStatus : updates[0]?.status;
    const currentStepIndex = ORDER_STEPS.findIndex((step) => step === effectiveStatus);

    return ORDER_STEPS.map((step, index) => {
      let state: StepState = 'upcoming';
      if (currentStepIndex >= 0) {
        if (index < currentStepIndex) {
          state = 'complete';
        } else if (index === currentStepIndex) {
          state = 'current';
        }
      }

      return {
        id: step,
        status: step,
        label: formatStatusLabel(step),
        state,
      };
    });
  }, [currentStatus, updates]);

  useEffect(() => {
    if (!updateFilterOptions.some((option) => option.value === selectedStatusFilter)) {
      setSelectedStatusFilter('all');
    }
  }, [selectedStatusFilter, updateFilterOptions]);

  const selectedFilterLabel =
    updateFilterOptions.find((option) => option.value === selectedStatusFilter)?.label ?? 'All updates';

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'refresh-order-tracking',
        label: 'Refresh tracking',
        onPress: () => {
          void loadTracking();
        },
        icon: RefreshIcon,
        disabled: isLoading,
      }),
      buildBackTopBarAction({
        onPress: () => router.back(),
        label: 'Back to order',
      }),
    ];
  }, [isLoading, loadTracking, router]);

  useScreenTopBar({
    title: `Order ${Number.isFinite(orderNumber) ? orderNumber : '-'} / ${Number.isFinite(orderBatch) ? orderBatch : '-'}`,
    actions: topBarActions,
  });

  return (
    <ScreenContent gap={10}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? <Text style={styles.muted}>Loading tracking...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isLoading && !error && tracking ? (
          <>
            <ThemedCard style={styles.card} title="Tracking Summary">
              <View style={styles.summaryHeadRow}>
                <View style={styles.statusBadge}>
                  {(() => {
                    const StatusIcon = getStatusIcon(currentStatus);
                    return <StatusIcon color={styles.badgeText.color} size={14} />;
                  })()}
                  <Text style={styles.badgeText}>{formatStatusLabel(currentStatus)}</Text>
                </View>
                <Text style={styles.cardMeta}>#{tracking.orderNumber ?? orderNumber}/{tracking.orderBatch ?? orderBatch}</Text>
              </View>
              {tracking.customerRef ? <Text style={styles.cardItem}>Customer ref: {tracking.customerRef}</Text> : null}
              <Text style={styles.cardMeta}>Last changed: {formatTrackingDate(lastUpdateTimestamp)}</Text>
              <Text style={styles.cardMeta}>
                {updates.length} update{updates.length === 1 ? '' : 's'} • {items.length} item{items.length === 1 ? '' : 's'}
              </Text>
            </ThemedCard>

            <ThemedCard style={styles.card} title="Journey">
              <View style={styles.stepRail}>
                {journeySteps.map((step) => {
                  const StepIcon = getStatusIcon(step.status);
                  const isCurrent = step.state === 'current';
                  const isComplete = step.state === 'complete';

                  return (
                    <View
                      key={step.id}
                      style={[
                        styles.stepChip,
                        isComplete ? styles.stepChipComplete : null,
                        isCurrent ? styles.stepChipCurrent : null,
                      ]}
                    >
                      <StepIcon
                        size={14}
                        color={
                          isCurrent || isComplete ? styles.stepChipStateText.color : styles.stepChipText.color
                        }
                      />
                      <Text
                        style={[
                          styles.stepChipText,
                          isCurrent || isComplete ? styles.stepChipStateText : null,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ThemedCard>

            <ThemedCard style={styles.card} title="Problems & Checks">
              {detectedProblems.map((problem) => {
                const isWarn = problem.level === 'warn';
                const ProblemIcon = isWarn ? AlertTriangle : CheckCircle2;

                return (
                  <View
                    key={problem.id}
                    style={[styles.problemRow, isWarn ? styles.problemRowWarn : styles.problemRowOk]}
                  >
                    <ProblemIcon
                      size={16}
                      color={isWarn ? styles.problemWarnText.color : styles.problemOkText.color}
                    />
                    <Text style={isWarn ? styles.problemWarnText : styles.problemOkText}>{problem.message}</Text>
                  </View>
                );
              })}
            </ThemedCard>

            <ThemedCard style={styles.card} title="Updates">
              <View style={styles.updatesToolbar}>
                <View style={styles.filterGroup}>
                  <Filter size={14} color={styles.filterButtonText.color} />
                  <Text style={styles.filterLabel}>Filter</Text>
                </View>

                <View style={styles.filterContainer}>
                  <Pressable
                    onPress={() => setIsFilterOpen((current) => !current)}
                    style={({ pressed }) => [styles.filterButton, pressed ? styles.filterButtonPressed : null]}
                    accessibilityRole="button"
                    accessibilityLabel="Filter updates by status"
                  >
                    <Text style={styles.filterButtonText}>{selectedFilterLabel}</Text>
                    {isFilterOpen ? (
                      <ChevronUp size={14} color={styles.filterButtonText.color} />
                    ) : (
                      <ChevronDown size={14} color={styles.filterButtonText.color} />
                    )}
                  </Pressable>

                  {isFilterOpen ? (
                    <View style={styles.filterDropdown}>
                      {updateFilterOptions.map((option) => (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            setSelectedStatusFilter(option.value);
                            setIsFilterOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.filterOption,
                            option.value === selectedStatusFilter ? styles.filterOptionActive : null,
                            pressed ? styles.filterOptionPressed : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              option.value === selectedStatusFilter ? styles.filterOptionTextActive : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>

              {filteredUpdates.length === 0 ? (
                <Text style={styles.muted}>No updates match this filter.</Text>
              ) : (
                filteredUpdates.map((entry, index) => {
                  const StatusIcon = getStatusIcon(entry.status);
                  const isExpanded = expandedUpdateId === entry.id;

                  return (
                    <View key={entry.id} style={styles.updateRow}>
                      <Pressable
                        onPress={() => {
                          setExpandedUpdateId((current) => (current === entry.id ? null : entry.id));
                        }}
                        style={({ pressed }) => [styles.updateHeader, pressed ? styles.updateHeaderPressed : null]}
                        accessibilityRole="button"
                        accessibilityLabel={`Toggle details for ${entry.statusLabel} update`}
                      >
                        <View style={styles.updateHeaderMain}>
                          <View style={styles.updateStatusBadge}>
                            <StatusIcon size={14} color={styles.badgeText.color} />
                            <Text style={styles.badgeText}>{entry.statusLabel}</Text>
                          </View>
                          <Text style={styles.updateTimestamp}>{entry.timestampLabel}</Text>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={14} color={styles.cardMeta.color} />
                        ) : (
                          <ChevronDown size={14} color={styles.cardMeta.color} />
                        )}
                      </Pressable>

                      {isExpanded ? (
                        <View style={styles.updateBody}>
                          <Text style={styles.cardMeta}>Event #{filteredUpdates.length - index}</Text>
                          {entry.message ? <Text style={styles.cardItem}>{entry.message}</Text> : null}
                          {entry.note ? <Text style={styles.cardMeta}>Note: {entry.note}</Text> : null}
                          <Text style={styles.cardMeta}>Raw status: {entry.status}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ThemedCard>

            <ThemedCard style={styles.card} title="Items Snapshot">
              {items.length === 0 ? (
                <Text style={styles.muted}>No item details returned for this order.</Text>
              ) : (
                items.map((item, index) => {
                  const ItemStatusIcon = getStatusIcon(item.status);
                  return (
                    <View key={`${item.serialNumber ?? 'item'}-${index}`} style={styles.itemRow}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.cardItem}>{item.serialNumber ?? 'Unknown serial'}</Text>
                        <View style={styles.itemStatusBadge}>
                          <ItemStatusIcon size={12} color={styles.itemBadgeText.color} />
                          <Text style={styles.itemBadgeText}>{formatStatusLabel(item.status)}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardMeta}>{item.description ?? 'No description'}</Text>
                      {item.side ? <Text style={styles.cardMeta}>Side: {item.side}</Text> : null}
                    </View>
                  );
                })
              )}
            </ThemedCard>

            <ThemedCard style={styles.card} title="Raw Payload">
              <Text style={styles.rawPayload}>{JSON.stringify(tracking, null, 2)}</Text>
            </ThemedCard>
          </>
        ) : null}
      </ScrollView>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: 10,
      paddingBottom: 8,
    },
    card: {
      ...common.card,
      gap: 8,
    },
    summaryHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.accentMuted,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
    stepRail: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    stepChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    stepChipComplete: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentMuted,
    },
    stepChipCurrent: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    stepChipText: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 12,
    },
    stepChipStateText: {
      color: theme.colors.textPrimary,
    },
    problemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    problemRowWarn: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerSurface,
    },
    problemRowOk: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    problemWarnText: {
      color: theme.colors.danger,
      flex: 1,
    },
    problemOkText: {
      color: theme.colors.textSecondary,
      flex: 1,
    },
    updatesToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    filterGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterLabel: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    filterContainer: {
      minWidth: 170,
      position: 'relative',
      zIndex: 20,
    },
    filterButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radii.md,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    filterButtonPressed: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    filterButtonText: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: 13,
      flexShrink: 1,
    },
    filterDropdown: {
      position: 'absolute',
      top: 42,
      left: 0,
      right: 0,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceElevated,
      padding: 4,
      gap: 2,
    },
    filterOption: {
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: theme.radii.sm,
    },
    filterOptionActive: {
      backgroundColor: theme.colors.accentMuted,
    },
    filterOptionPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    filterOptionText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    filterOptionTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    updateRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    updateHeaderPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    updateHeaderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      gap: 8,
      flexWrap: 'wrap',
    },
    updateStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignSelf: 'flex-start',
    },
    updateTimestamp: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    updateBody: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 6,
      backgroundColor: theme.colors.surface,
    },
    itemRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 4,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    itemStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    itemBadgeText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    rawPayload: {
      color: theme.colors.textSecondary,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 18,
    },
  });
}
