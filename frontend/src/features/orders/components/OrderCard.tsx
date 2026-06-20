import { useRouter } from 'expo-router';
import { Pencil as EditOrderIcon, Send as DispatchOrderIcon, SquareCheck as DispatchedOrderIcon } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { resolveOrderStatus } from '@src/features/orders/types';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface OrderCardData {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  currentStatus?: string;
  void?: boolean;
  dispatchedOn?: string | null;
  customerAccount?: number;
  /** Resolved customer company name (from useBulkOrderCustomers) */
  customerName?: string | null;
  /** Resolved customer account number (from useBulkOrderCustomers) */
  customerAccountNumber?: string | null;
}

interface OrderCardProps {
  order: OrderCardData;
  onDispatch?: (order: OrderCardData) => void | Promise<void>;
  isDispatching?: boolean;
}

export function OrderCard({ order, onDispatch, isDispatching = false }: OrderCardProps) {
  const router = useRouter();
  const { canMutate } = useAuth();
  const styles = useThemedStyles(createStyles);
  const isDispatched = resolveOrderStatus(order)?.trim().toLowerCase() === 'dispatched';

  const handleOpenOrder = useCallback(() => {
    router.push(`/(app)/orders/${order.orderNumber}/${order.orderBatch}` as never);
  }, [order.orderBatch, order.orderNumber, router]);

  const handleOpenOrderEdit = useCallback(() => {
    router.push(`/(app)/orders/${order.orderNumber}/${order.orderBatch}?mode=edit` as never);
  }, [order.orderBatch, order.orderNumber, router]);

  const handleDispatch = useCallback(() => {
    if (onDispatch) {
      void onDispatch(order);
      return;
    }

    router.push(`/(app)/orders/${order.orderNumber}/${order.orderBatch}?mode=edit&dispatch=true` as never);
  }, [onDispatch, order, router]);

  const actions = useMemo<TopBarAction[]>(() => {
    const dispatchDisabled = isDispatched || isDispatching;

    const nextActions: TopBarAction[] = [
      buildIconTopBarAction({
        id: `edit-order-${order.orderNumber}-${order.orderBatch}`,
        label: 'Edit order',
        onPress: handleOpenOrderEdit,
        icon: EditOrderIcon,
        hidden: !canMutate,
      }),
    ];

    if (canMutate) {
      nextActions.push(buildIconTopBarAction({
        id: `dispatch-order-${order.orderNumber}-${order.orderBatch}`,
        label: isDispatched ? 'Order already dispatched' : isDispatching ? 'Dispatching order' : 'Dispatch order',
        onPress: handleDispatch,
        icon: isDispatched ? DispatchedOrderIcon : DispatchOrderIcon,
        disabled: dispatchDisabled,
      }));
    }

    return nextActions;
  }, [canMutate, handleDispatch, handleOpenOrderEdit, isDispatched, isDispatching, order.orderBatch, order.orderNumber]);

  return (
    <ThemedCard
      style={styles.card}
      title={`Order ${order.orderNumber} / Batch ${order.orderBatch}`}
      actions={actions}
      onPress={handleOpenOrder}
    >
      <View style={styles.bottomRow}>
        <View style={styles.customerInfo}>
          {order.customerName ? (
            <>
              <Text style={styles.customerName}>{order.customerName}</Text>
              {order.customerAccountNumber ? (
                <Text style={styles.customerNumber}>{order.customerAccountNumber}</Text>
              ) : null}
            </>
          ) : typeof order.customerAccount === 'number' ? (
            <Text style={styles.customerName}>Customer: {order.customerAccount}</Text>
          ) : null}
        </View>
        <OrderStatusBadge
          status={resolveOrderStatus(order) ?? 'Unknown'}
          style={{ alignSelf: 'flex-end' }}
        />
      </View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    card: common.card,
    bottomRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-end' as const,
    },
    customerInfo: {
      flexShrink: 1,
      marginRight: 12,
    },
    customerName: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '600' as const,
    },
    customerNumber: {
      color: theme.colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
  };
}
