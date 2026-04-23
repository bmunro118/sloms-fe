import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TooltipPressable } from '@components/ui/TooltipPressable';
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
        <View style={styles.contentActionRowRight}>
          <TooltipPressable
            tooltip={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
            accessibilityRole="button"
            accessibilityLabel={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
            disabled={isDispatching}
            onPress={handleDispatch}
            style={(state) => [
              styles.contentActionButton,
              isDispatching ? styles.contentActionButtonDisabled : null,
              isHovered(state) && !isDispatching ? styles.contentActionButtonHover : null,
              state.pressed && !isDispatching ? styles.contentActionButtonPressed : null,
            ]}
          >
            <Text style={[styles.contentActionButtonText, isDispatching ? styles.contentActionButtonTextDisabled : null]}>
              {isDispatching ? 'Dispatching...' : 'Mark as dispatched'}
            </Text>
          </TooltipPressable>
        </View>
      ) : (
        <Text style={styles.muted}>Read-only role: dispatch action hidden.</Text>
      )}
    </ScreenContent>
  );
}

function isHovered(state: PressableStateCallbackType) {
  return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      gap: 6,
    },
    contentActionRowRight: {
      ...common.contentActionRowRight,
      marginTop: 4,
    },
  });
}
