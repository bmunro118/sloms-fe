import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { FieldPair } from '@components/ui/FieldPair';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { useAuth } from '@context/AuthContext';
import { OrderDetails, resolveOrderStatus } from '../types';
import { OrderTrackingPayload, formatTrackingDate } from '../tracking-types';
import { TopBarAction } from '@context/ScreenTitleContext';

interface OrderTrackingSummaryCardProps {
  order: OrderDetails | null;
  tracking: OrderTrackingPayload | null;
  currentStatus: string;
  lastUpdateTimestamp: string | undefined;
  updatesCount: number;
  itemsCount: number;
  isEditing: boolean;
  /** Card-level actions passed through when editing (edit/save/cancel from the main screen) */
  cardActions: TopBarAction[];
}

export function OrderTrackingSummaryCard({
  order,
  tracking,
  currentStatus,
  lastUpdateTimestamp,
  updatesCount,
  itemsCount,
  isEditing: _isEditing,
  cardActions,
}: OrderTrackingSummaryCardProps) {
  const { canMutate } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = useMemo(() => width < 768, [width]);
  const styles = useThemedStyles(createStyles);

  if (!order) return null;

  const displayStatus = resolveOrderStatus(order);

  return (
    <ThemedCard style={styles.card} title="Order Details" actions={canMutate ? cardActions : undefined}>
      {/* Status badge — marginTop cancels ThemedCard headerBottomSpacing so net gap = card gap (8px) */}
      <OrderStatusBadge status={displayStatus} style={{ marginTop: -8 }} />

      <FieldPair
        compact={isCompact}
        left={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order</Text>
            <Text style={styles.fieldValue}>#{tracking?.orderNumber ?? order.orderNumber}/{tracking?.orderBatch ?? order.orderBatch}</Text>
          </View>
        }
        right={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer</Text>
            <Text style={styles.fieldValue}>{order.customerAccount ?? 'N/A'}</Text>
          </View>
        }
      />
      <FieldPair
        compact={isCompact}
        left={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer Ref</Text>
            <Text style={styles.fieldValue}>{order.customerRef ?? tracking?.customerRef ?? 'N/A'}</Text>
          </View>
        }
        right={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order Contact</Text>
            <Text style={styles.fieldValue}>{order.orderContact ?? 'N/A'}</Text>
          </View>
        }
      />
      <FieldPair
        compact={isCompact}
        left={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <Text style={styles.fieldValue}>{order.deliveryAddress ?? 'N/A'}</Text>
          </View>
        }
        right={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price Band</Text>
            <Text style={styles.fieldValue}>{order.priceBand ?? 'N/A'}</Text>
          </View>
        }
      />

      {/* Timestamp and counts */}
      <Text style={styles.cardMeta}>Last changed: {formatTrackingDate(lastUpdateTimestamp)}</Text>
      <Text style={styles.cardMeta}>
        {updatesCount} update{updatesCount === 1 ? '' : 's'} &bull; {itemsCount} item{itemsCount === 1 ? '' : 's'}
      </Text>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 8 },
    field: { marginTop: theme.spacing.sm },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    cardMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
  });
}
