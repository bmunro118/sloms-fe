import { useRouter } from 'expo-router';
import { Plus as PlusIcon, RefreshCw as RefreshIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
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
  const styles = useThemedStyles(createStyles);
  const [refreshTick, setRefreshTick] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        icon: PlusIcon,
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
        <ThemedCard
          key={`${order.orderNumber}-${order.orderBatch}`}
          style={styles.card}
          onPress={() => router.push(`/(app)/orders/${order.orderNumber}/${order.orderBatch}` as never)}
        >
          <Text style={styles.cardTitle}>Order {order.orderNumber} / Batch {order.orderBatch}</Text>
          <Text style={styles.cardMeta}>Status: {order.status ?? 'Unknown'}</Text>
          {typeof order.customerAccount === 'number' ? (
            <Text style={styles.cardMeta}>Customer: {order.customerAccount}</Text>
          ) : null}
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
