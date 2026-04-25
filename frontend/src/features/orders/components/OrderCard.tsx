import { useRouter } from 'expo-router';
import { Pencil as EditOrderIcon, Send as DispatchOrderIcon, SquareCheck as DispatchedOrderIcon } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Text } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface OrderCardData {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
}

interface OrderCardProps {
  order: OrderCardData;
  onDispatch?: (order: OrderCardData) => void | Promise<void>;
  isDispatching?: boolean;
}

export function OrderCard({ order, onDispatch, isDispatching = false }: OrderCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const isDispatched = order.status?.trim().toLowerCase() === 'dispatched';

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

    return [
      buildIconTopBarAction({
        id: `edit-order-${order.orderNumber}-${order.orderBatch}`,
        label: 'Edit order',
        onPress: handleOpenOrderEdit,
        icon: EditOrderIcon,
      }),
      buildIconTopBarAction({
        id: `dispatch-order-${order.orderNumber}-${order.orderBatch}`,
        label: isDispatched ? 'Order already dispatched' : isDispatching ? 'Dispatching order' : 'Dispatch order',
        onPress: handleDispatch,
        icon: isDispatched ? DispatchedOrderIcon : DispatchOrderIcon,
        disabled: dispatchDisabled,
      }),
    ];
  }, [handleDispatch, handleOpenOrderEdit, isDispatched, isDispatching, order.orderBatch, order.orderNumber]);

  return (
    <ThemedCard
      style={styles.card}
      title={`Order ${order.orderNumber} / Batch ${order.orderBatch}`}
      actions={actions}
      onPress={handleOpenOrder}
    >
      <Text style={styles.cardMeta}>Status: {order.status ?? 'Unknown'}</Text>
      {typeof order.customerAccount === 'number' ? (
        <Text style={styles.cardMeta}>Customer: {order.customerAccount}</Text>
      ) : null}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    card: common.card,
    cardMeta: common.cardMeta,
  };
}
