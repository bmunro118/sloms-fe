import { useRouter } from 'expo-router';
import { PackagePlus as PackagePlusIcon, RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { FilterModal } from '@components/ui/FilterModal';
import { ListFilterHeader } from '@components/ui/ListFilterHeader';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { OrdersListQuery } from '@src/features/orders/api';
import { OrderCard } from '@src/features/orders/components/OrderCard';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useListFilters } from '@src/hooks/useListFilters';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { dispatchOrder, listOrders } from '@src/features/orders/api';
import { ApiError } from '@utils/api';

type OrderRow = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
};

type OrdersResponse = {
  data?: OrderRow[];
};

type OrderStatus = 'Received' | 'InProduction' | 'Ready' | 'Dispatched' | 'Voided' | '';

type OrderFilters = {
  status: OrderStatus;
  includeVoided: boolean;
  customerId: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

const INITIAL_FILTERS: OrderFilters = {
  status: '',
  includeVoided: false,
  customerId: '',
};
const STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Any', value: '' },
  { label: 'Received', value: 'Received' },
  { label: 'In Production', value: 'InProduction' },
  { label: 'Ready', value: 'Ready' },
  { label: 'Dispatched', value: 'Dispatched' },
  { label: 'Voided', value: 'Voided' },
];

export default function OrdersListScreen() {
  const router = useRouter();
  const { canMutate, isStaff } = useAuth();
  const { showConfirm } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [refreshTick, setRefreshTick] = useState(0);
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchingOrderKey, setDispatchingOrderKey] = useState<string | null>(null);
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
          return { ...entry, status: 'Dispatched' };
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

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildIconTopBarAction({
        id: 'refresh-orders',
        label: 'Refresh orders',
        onPress: () => setRefreshTick((value) => value + 1),
        icon: RefreshIcon,
        disabled: isLoading,
      }),
    ];

    if (isStaff && canMutate) {
      actions.push(buildIconTopBarAction({
        id: 'create-order',
        label: 'Create order',
        onPress: () => router.push('/(app)/orders/create'),
        icon: PackagePlusIcon,
      }));
    }

    return actions;
  }, [canMutate, isLoading, isStaff, router]);

  const listQuery = useMemo<OrdersListQuery>(() => {
    const customerIdRaw = appliedFilters.customerId.trim();
    const parsedCustomerId = customerIdRaw ? Number(customerIdRaw) : undefined;

    return {
      includeVoided: appliedFilters.includeVoided ? true : undefined,
      status: appliedFilters.status || undefined,
      customerId:
        Number.isFinite(parsedCustomerId) && (parsedCustomerId as number) > 0
          ? parsedCustomerId
          : undefined,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    };
  }, [appliedFilters.customerId, appliedFilters.includeVoided, appliedFilters.status]);

  const hasServerFilterQuery = useMemo(() => {
    return Boolean(listQuery.includeVoided || listQuery.status || listQuery.customerId);
  }, [listQuery.customerId, listQuery.includeVoided, listQuery.status]);

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

  const ordersByFilter = allOrders.filter((o) => {
    const customerIdRaw = appliedFilters.customerId.trim();
    const parsedCustomerId = customerIdRaw ? Number(customerIdRaw) : NaN;

    if (!appliedFilters.includeVoided && o.status === 'Voided') {
      return false;
    }

    if (appliedFilters.status && o.status !== appliedFilters.status) {
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
          (o.status?.toLowerCase().includes(q) ?? false)
        );
      })
    : ordersByFilter;

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

        {isLoading ? <Text style={styles.muted}>Loading orders...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && orders.length === 0 ? <Text style={styles.muted}>No orders found.</Text> : null}

        {orders.map((order) => (
          <OrderCard
            key={`${order.orderNumber}-${order.orderBatch}`}
            order={order}
            onDispatch={handleDispatchFromList}
            isDispatching={dispatchingOrderKey === `${order.orderNumber}-${order.orderBatch}`}
          />
        ))}
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
                      backgroundColor: active ? theme.colors.accentMuted : theme.colors.inputBackground,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={{ color: active ? theme.colors.accent : theme.colors.textSecondary, fontSize: 13 }}>
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

        {/* Include voided toggle */}
        <View style={styles.toggleRow}>
          <Text style={{ color: theme.colors.textPrimary }}>Include voided</Text>
          <Switch
            value={draftFilters.includeVoided}
            onValueChange={(val) => setDraftFilter('includeVoided', val)}
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
