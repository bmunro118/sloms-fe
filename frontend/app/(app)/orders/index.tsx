import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
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
  useScreenTitle('Orders');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  return (
    <ScreenContent>
      {isStaff && canMutate ? (
        <ThemedButton label="Create order" onPress={() => router.push('/(app)/orders/create')} style={styles.primaryButton} />
      ) : null}

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
