import { useRouter } from 'expo-router';
import { PackagePlus as PackagePlusIcon, ScanLine } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { OrdersListQuery } from '@src/features/orders/api';
import { OrderCard } from '@src/features/orders/components/OrderCard';
import { useBulkOrderCustomers } from '@src/features/orders/hooks/useBulkOrderCustomers';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useFeatureFlag } from '@src/hooks/useFeatureFlag';
import { useListFilters } from '@src/hooks/useListFilters';
import { ScanLabelsModal, useScanLabel } from '@features/scan-labels';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { dispatchOrder, getOrderItemBySerial, listOrders, OrderItem } from '@src/features/orders/api';
import { SerialMatchCard } from '@src/features/orders/components/SerialMatchCard';
import { resolveOrderStatus } from '@src/features/orders/types';
import { ApiError } from '@utils/api';

type OrderRow = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  currentStatus?: string;
  void?: boolean;
  dispatchedOn?: string | null;
  customerAccount?: number;
};

type OrdersResponse = {
  data?: OrderRow[];
};

type OrderStatus = 'Received' | 'InProduction' | 'Ready' | 'Dispatched' | '';

type OrderFilters = {
  status: OrderStatus;
  customerId: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

const INITIAL_FILTERS: OrderFilters = {
  status: '',
  customerId: '',
};
const STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Any', value: '' },
  { label: 'Received', value: 'Received' },
  { label: 'In Production', value: 'InProduction' },
  { label: 'Ready', value: 'Ready' },
  { label: 'Dispatched', value: 'Dispatched' },
];

export default function OrdersListScreen() {
  const router = useRouter();
  const { canMutate, isStaff } = useAuth();
  const { showConfirm } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const scanLabelsEnabled = useFeatureFlag('scanLabels');
  const [refreshTick, setRefreshTick] = useState(0);
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchingOrderKey, setDispatchingOrderKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serialMatch, setSerialMatch] = useState<OrderItem | null>(null);

  const handleLabelScanned = useCallback((label: string) => {
    setSearchQuery(label);
  }, [setSearchQuery]);

  const scanState = useScanLabel({ onLabelScanned: handleLabelScanned });

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
  } = useListFilters<OrderFilters>(INITIAL_FILTERS);

  const handleDispatchFromList = useCallback(async (order: OrderRow) => {
    if (!canMutate) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Mark Order as Dispatched',
      message: `Are you sure you want to mark order ${order.orderNumber}/${order.orderBatch} as dispatched? This action cannot be undone.`,
      confirmLabel: 'Dispatch',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    const orderKey = `${order.orderNumber}-${order.orderBatch}`;
    setDispatchingOrderKey(orderKey);
    setError(null);

    try {
      await dispatchOrder(order.orderNumber, order.orderBatch);

      setAllOrders((previousOrders) => previousOrders.map((entry) => {
        if (entry.orderNumber === order.orderNumber && entry.orderBatch === order.orderBatch) {
          return { ...entry, status: 'Dispatched', currentStatus: 'Dispatched', dispatchedOn: new Date().toISOString() };
        }
        return entry;
      }));

      setRefreshTick((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch order.');
    } finally {
      setDispatchingOrderKey((currentKey) => (currentKey === orderKey ? null : currentKey));
    }
  }, [canMutate, showConfirm]);

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isLoading) setIsRefreshing(false);
  }, [isLoading]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [];

    if (isStaff && canMutate) {
      actions.push(buildIconTopBarAction({
        id: 'create-order',
        label: 'New Order',
        onPress: () => router.push('/(app)/orders/create'),
        icon: PackagePlusIcon,
        secondary: true,
      }));
    }

    if (scanLabelsEnabled && isStaff) {
      actions.push(
        buildIconTopBarAction({
          id: 'scan-labels',
          label: 'Scan Labels',
          onPress: scanState.openScanner,
          icon: ScanLine,
          disabled: isLoading,
        })
      );
    }

    return actions;
  }, [canMutate, isStaff, router, scanLabelsEnabled, scanState.openScanner, isLoading]);

  const listQuery = useMemo<OrdersListQuery>(() => {
    const customerIdRaw = appliedFilters.customerId.trim();
    const parsedCustomerId = customerIdRaw ? Number(customerIdRaw) : undefined;

    return {
      status: appliedFilters.status || undefined,
      customerId:
        Number.isFinite(parsedCustomerId) && (parsedCustomerId as number) > 0
          ? parsedCustomerId
          : undefined,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    };
  }, [appliedFilters.customerId, appliedFilters.status]);

  const hasServerFilterQuery = useMemo(() => {
    return Boolean(listQuery.status || listQuery.customerId);
  }, [listQuery.customerId, listQuery.status]);

  useScreenTopBar({ title: 'Orders', actions: topBarActions });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await listOrders(listQuery, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setAllOrders(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (
          !controller.signal.aborted
          && hasServerFilterQuery
          && err instanceof ApiError
          && (err.status === 400 || err.status === 422)
        ) {
          try {
            const fallback = await listOrders(undefined, { signal: controller.signal });
            if (!controller.signal.aborted) {
              setAllOrders(Array.isArray(fallback?.data) ? fallback.data : []);
              return;
            }
          } catch {
            // Fall through to the primary error state if fallback also fails.
          }
        }

        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load orders.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [hasServerFilterQuery, listQuery, refreshTick]);

  // Serial number lookup — fires alongside the debounced search
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term) { setSerialMatch(null); return; }
    const controller = new AbortController();
    getOrderItemBySerial<OrderItem>(term)
      .then((item) => { if (!controller.signal.aborted) setSerialMatch(item); })
      .catch(() => { if (!controller.signal.aborted) setSerialMatch(null); });
    return () => { controller.abort(); };
  }, [debouncedSearch]);

  const customerMap = useBulkOrderCustomers(allOrders);

  const ordersByFilter = allOrders.filter((o) => {
    const customerIdRaw = appliedFilters.customerId.trim();
    const parsedCustomerId = customerIdRaw ? Number(customerIdRaw) : NaN;
    const resolvedStatus = resolveOrderStatus(o);

    if (appliedFilters.status && resolvedStatus !== appliedFilters.status) {
      return false;
    }

    if (Number.isFinite(parsedCustomerId) && parsedCustomerId > 0 && o.customerAccount !== parsedCustomerId) {
      return false;
    }

    return true;
  });

  const orders = debouncedSearch.trim()
    ? ordersByFilter.filter((o) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          String(o.orderNumber).includes(q) ||
          String(o.orderBatch).includes(q) ||
          (resolveOrderStatus(o)?.toLowerCase().includes(q) ?? false)
        );
      })
    : ordersByFilter;

  const resolvedOrders = useMemo(
    () =>
      customerMap.size > 0
        ? orders.map((o) => {
            const info = o.customerAccount != null ? customerMap.get(o.customerAccount) : undefined;
            return info ? { ...o, customerName: info.customerName, customerAccountNumber: info.customerAccountNumber } : o;
          })
        : orders,
    [customerMap, orders],
  );

  return (
    <>
      <ScreenContent>
        <ListFilterHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={openModal}
          hasActiveFilters={hasActiveFilters}
          placeholder="Search orders..."
        />

        {isLoading ? <LoadingSpinner message="Loading orders..." fullScreen /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isLoading && !error ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              Platform.OS !== 'web' ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />
              ) : undefined
            }
          >
            {serialMatch ? <SerialMatchCard item={serialMatch} /> : null}
            {resolvedOrders.length === 0 && !serialMatch ? <Text style={styles.muted}>No orders found.</Text> : null}
            {resolvedOrders.map((order) => (
              <OrderCard
                key={`${order.orderNumber}-${order.orderBatch}`}
                order={order}
                onDispatch={handleDispatchFromList}
                isDispatching={dispatchingOrderKey === `${order.orderNumber}-${order.orderBatch}`}
              />
            ))}
          </ScrollView>
        ) : null}
      </ScreenContent>

      <FilterModal
        visible={isModalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        onClear={clearFilters}
        title="Filter Orders"
      >
        {/* Status picker */}
        <View>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Status</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = draftFilters.status === opt.value;
              return (
                <Pressable
                  key={opt.value || '__any__'}
                  onPress={() => setDraftFilter('status', opt.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                      backgroundColor: active ? theme.colors.accent : theme.colors.inputBackground,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <Text
                    style={{
                      color: active ? theme.colors.accentText : theme.colors.textSecondary,
                      fontSize: 13,
                      fontWeight: active ? '600' : '500',
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isStaff ? (
          <View>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Customer ID</Text>
            <ThemedInput
              keyboardType="number-pad"
              placeholder="Filter by customer ID"
              value={draftFilters.customerId}
              onChangeText={(text) => setDraftFilter('customerId', text)}
            />
          </View>
        ) : null}
      </FilterModal>
      {scanLabelsEnabled ? (
        <ScanLabelsModal
          visible={scanState.isModalVisible}
          onClose={scanState.closeScanner}
          onLabelScanned={handleLabelScanned}
          manualText={scanState.manualText}
          setManualText={scanState.setManualText}
          handleManualSubmit={scanState.handleManualSubmit}
          step={scanState.step}
          capturedPhoto={scanState.capturedPhoto}
          correctionText={scanState.correctionText}
          onPhotoTaken={scanState.onPhotoTaken}
          onRetake={scanState.onRetake}
          onCorrectionConfirm={scanState.onCorrectionConfirm}
          extraction={scanState.extraction}
          isLoading={scanState.isLoading}
          error={scanState.error}
          onConfirmExtraction={scanState.handleConfirmExtraction}
        />
      ) : null}
    </>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    listContent: {
      gap: 12,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
