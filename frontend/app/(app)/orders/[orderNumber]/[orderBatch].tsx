import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
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
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  useScreenTitle('Order Detail');
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
    <ScreenContent gap={10}>
      <Text style={styles.meta}>Order: {orderNumber} / Batch: {orderBatch}</Text>

      {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && order ? (
        <ThemedCard style={styles.card}>
          <Text style={styles.cardItem}>Status: {order.status ?? 'Unknown'}</Text>
          <Text style={styles.cardItem}>Customer: {order.customerAccount ?? 'N/A'}</Text>
          <Text style={styles.cardItem}>Ref: {order.customerRef ?? 'N/A'}</Text>
        </ThemedCard>
      ) : null}

      {canMutate ? (
        <ThemedButton
          style={styles.button}
          onPress={handleDispatch}
          label={isDispatching ? 'Dispatching...' : 'Mark as dispatched'}
          disabled={isDispatching}
        />
      ) : (
        <Text style={styles.muted}>Read-only role: dispatch action hidden.</Text>
      )}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      gap: 6,
    },
    button: {
      marginTop: 4,
      paddingVertical: 11,
    },
  });
}
