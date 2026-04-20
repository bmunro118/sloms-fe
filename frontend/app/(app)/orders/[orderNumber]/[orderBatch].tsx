import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type OrderDetails = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
  customerRef?: string;
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string }>();
  const { canMutate } = useAuth();
  const isMountedRef = useIsMountedRef();
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpdate = (signal?: AbortSignal) => isMountedRef.current && !signal?.aborted;

  const reload = async (signal?: AbortSignal) => {
    if (!canUpdate(signal)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest<OrderDetails>(ENDPOINTS.orders.byId(orderNumber, orderBatch), {
        method: 'GET',
        requireAuth: true,
        signal,
      });
      if (canUpdate(signal)) {
        setOrder(response);
      }
    } catch (err) {
      if (canUpdate(signal)) {
        setError(err instanceof Error ? err.message : 'Failed to load order.');
      }
    } finally {
      if (canUpdate(signal)) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setError('Invalid order route parameters.');
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    reload(controller.signal);

    return () => {
      controller.abort();
    };
  }, [orderNumber, orderBatch]);

  const handleDispatch = async () => {
    if (!canMutate) return;
    setIsDispatching(true);
    setError(null);
    try {
      await apiRequest(ENDPOINTS.orders.dispatch(orderNumber, orderBatch), {
        method: 'PATCH',
        requireAuth: true,
      });
      await reload();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to dispatch order.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsDispatching(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Detail</Text>
      <Text style={styles.meta}>Order: {orderNumber} / Batch: {orderBatch}</Text>

      {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && order ? (
        <View style={styles.card}>
          <Text style={styles.cardItem}>Status: {order.status ?? 'Unknown'}</Text>
          <Text style={styles.cardItem}>Customer: {order.customerAccount ?? 'N/A'}</Text>
          <Text style={styles.cardItem}>Ref: {order.customerRef ?? 'N/A'}</Text>
        </View>
      ) : null}

      {canMutate ? (
        <Pressable
          style={[styles.button, isDispatching ? styles.disabled : null]}
          onPress={handleDispatch}
          disabled={isDispatching}
        >
          <Text style={styles.buttonText}>{isDispatching ? 'Dispatching...' : 'Mark as dispatched'}</Text>
        </Pressable>
      ) : (
        <Text style={styles.muted}>Read-only role: dispatch action hidden.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: {
    color: '#334155',
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
    gap: 6,
  },
  cardItem: {
    color: '#0f172a',
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});
