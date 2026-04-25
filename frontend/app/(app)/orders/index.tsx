import { useRouter } from 'expo-router';
import { PackagePlus as PackagePlusIcon, RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { OrderCard } from '@src/features/orders/components/OrderCard';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type OrderRow = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
};

type OrdersResponse = {
  data?: OrderRow[];
};

export default function OrdersListScreen() {
  const router = useRouter();
  const { canMutate, isStaff } = useAuth();
  const { showConfirm } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const [refreshTick, setRefreshTick] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchingOrderKey, setDispatchingOrderKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      await apiRequest(ENDPOINTS.orders.dispatch(order.orderNumber, order.orderBatch), {
        method: 'PATCH',
        requireAuth: true,
      });

      setOrders((previousOrders) => previousOrders.map((entry) => {
        if (entry.orderNumber === order.orderNumber && entry.orderBatch === order.orderBatch) {
          return {
            ...entry,
            status: 'Dispatched',
          };
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

  useScreenTopBar({ title: 'Orders', actions: topBarActions });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<OrdersResponse>(ENDPOINTS.orders.list, {
          method: 'GET',
          requireAuth: true,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setOrders(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
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
  }, [refreshTick]);

  return (
    <ScreenContent>
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
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
