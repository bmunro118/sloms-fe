import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FilterOption,
  JourneyStep,
  ORDER_STEPS,
  OrderTrackingPayload,
  StepState,
  TimelineUpdate,
  TrackingItem,
  formatStatusLabel,
  formatTrackingDate,
  normalizeTrackingTimestamp,
} from './tracking-types';
import { getOrderTracking } from './api';

export interface OrderTrackingState {
  tracking: OrderTrackingPayload | null;
  isLoadingTracking: boolean;
  trackingError: string | null;
  updates: TimelineUpdate[];
  trackingItems: TrackingItem[];
  currentStatus: string;
  lastUpdateTimestamp: string | undefined;
  journeySteps: JourneyStep[];
  detectedProblems: Array<{ id: string; level: 'ok' | 'warn'; message: string }>;
  updateFilterOptions: FilterOption[];
  filteredUpdates: TimelineUpdate[];
  selectedStatusFilter: string;
  setSelectedStatusFilter: (value: string) => void;
  expandedUpdateId: string | null;
  setExpandedUpdateId: (id: string | null) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (value: boolean) => void;
  selectedFilterLabel: string;
  loadTracking: (signal?: AbortSignal) => Promise<void>;
}

export function useOrderTracking(
  orderNumber: number,
  orderBatch: number,
): OrderTrackingState {
  const [tracking, setTracking] = useState<OrderTrackingPayload | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(true);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);

  const loadTracking = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setTrackingError('Invalid order route parameters.');
      setIsLoadingTracking(false);
      return;
    }

    setIsLoadingTracking(true);
    setTrackingError(null);

    try {
      const response = await getOrderTracking<OrderTrackingPayload>(orderNumber, orderBatch, { signal });
      if (!signal?.aborted) {
        setTracking(response);
      }
    } catch (err) {
      if (!signal?.aborted) {
        const errStatus = typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status
          : undefined;
        const message =
          errStatus === 404
            ? 'Tracking data is not available for this order. The order may not have tracking history yet.'
            : err instanceof Error
              ? err.message
              : 'Failed to load tracking.';
        setTrackingError(message);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingTracking(false);
      }
    }
  }, [orderBatch, orderNumber]);

  const historyEntries = useMemo(() => {
    return Array.isArray(tracking?.history) ? tracking.history : [];
  }, [tracking?.history]);

  const trackingItems = useMemo(() => {
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

  const lastUpdateTimestamp = useMemo(() => {
    if (updates.length > 0) {
      return updates[0].timestamp;
    }

    if (typeof tracking?.statusChangedOn === 'string' && tracking.statusChangedOn.trim().length > 0) {
      return tracking.statusChangedOn;
    }

    return undefined;
  }, [tracking?.statusChangedOn, updates]);

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

  const itemStatuses = useMemo(() => {
    return Array.from(
      new Set(
        trackingItems
          .map((entry) => (typeof entry.status === 'string' ? entry.status : undefined))
          .filter((status): status is string => Boolean(status))
      )
    );
  }, [trackingItems]);

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

  const journeySteps = useMemo<JourneyStep[]>(() => {
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

  // Reset filter if selected value no longer valid
  useEffect(() => {
    if (!updateFilterOptions.some((option) => option.value === selectedStatusFilter)) {
      setSelectedStatusFilter('all');
    }
  }, [selectedStatusFilter, updateFilterOptions]);

  const selectedFilterLabel =
    updateFilterOptions.find((option) => option.value === selectedStatusFilter)?.label ?? 'All updates';

  return {
    tracking,
    isLoadingTracking,
    trackingError,
    updates,
    trackingItems,
    currentStatus,
    lastUpdateTimestamp,
    journeySteps,
    detectedProblems,
    updateFilterOptions,
    filteredUpdates,
    selectedStatusFilter,
    setSelectedStatusFilter,
    expandedUpdateId,
    setExpandedUpdateId,
    isFilterOpen,
    setIsFilterOpen,
    selectedFilterLabel,
    loadTracking,
  };
}
