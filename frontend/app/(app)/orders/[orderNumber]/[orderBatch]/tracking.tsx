import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw as RefreshIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { getOrderTracking } from '@src/features/orders/api';
import {
  FilterOption,
  ORDER_STEPS,
  OrderTrackingPayload,
  StepState,
  TimelineUpdate,
  formatStatusLabel,
  formatTrackingDate,
  getStatusIcon,
  normalizeTrackingTimestamp,
} from '@src/features/orders/tracking-types';
import { createStyles } from '@src/features/orders/tracking-styles';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useThemedStyles } from '@theme/useThemedStyles';

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
        console.log('[OrderTracking] Tracking loaded for order', orderNumber, '/', orderBatch, '— status:', (response as OrderTrackingPayload).currentStatus ?? (response as OrderTrackingPayload).status);
        setTracking(response);
      }
    } catch (err) {
      if (!signal?.aborted) {
        // Use duck-typing for status check — instanceof may not work across module boundaries in some bundler configurations
        const errStatus = typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status
          : undefined;
        console.error('[OrderTracking] Failed to load tracking data for order', orderNumber, '/', orderBatch, '— status:', errStatus, err);
        const message =
          errStatus === 404
            ? 'Tracking data is not available for this order. The order may not have tracking history yet.'
            : err instanceof Error
              ? err.message
              : 'Failed to load tracking.';
        setError(message);
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

