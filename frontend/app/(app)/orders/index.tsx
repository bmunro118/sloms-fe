import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { apiRequest } from '../../../utils/api';
import { ENDPOINTS } from '../../../utils/config';

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
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiRequest<OrdersResponse>(ENDPOINTS.orders.list, {
          method: 'GET',
          requireAuth: true,
        });
        if (mounted) {
          setOrders(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load orders.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Orders</Text>
        {isStaff && canMutate ? (
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(app)/orders/create')}>
            <Text style={styles.primaryButtonText}>Create order</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? <Text style={styles.muted}>Loading orders...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && !error && orders.length === 0 ? <Text style={styles.muted}>No orders found.</Text> : null}

      {orders.map((order) => (
        <Pressable
          key={`${order.orderNumber}-${order.orderBatch}`}
          style={styles.card}
          onPress={() => router.push(`/(app)/orders/${order.orderNumber}/${order.orderBatch}` as never)}
        >
          <Text style={styles.cardTitle}>Order {order.orderNumber} / Batch {order.orderBatch}</Text>
          <Text style={styles.cardMeta}>Status: {order.status ?? 'Unknown'}</Text>
          {typeof order.customerAccount === 'number' ? (
            <Text style={styles.cardMeta}>Customer: {order.customerAccount}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  muted: {
    color: '#64748b',
  },
  error: {
    color: '#b91c1c',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cardMeta: {
    color: '#475569',
    marginTop: 4,
  },
});
