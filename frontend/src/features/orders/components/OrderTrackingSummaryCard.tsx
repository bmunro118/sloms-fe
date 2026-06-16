import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { useAuth } from '@context/AuthContext';
import { OrderDetails, resolveOrderStatus } from '../types';
import { OrderTrackingPayload, formatStatusLabel, formatTrackingDate, getStatusIcon } from '../tracking-types';
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
  const StatusIcon = getStatusIcon(currentStatus !== 'Unknown' ? currentStatus : displayStatus);

  return (
    <ThemedCard style={styles.card} title="Order Details" actions={canMutate ? cardActions : undefined}>
      {/* Status badge */}
      <View style={styles.summaryHeadRow}>
        <View style={[
          styles.statusBadge,
          displayStatus === 'Received' ? styles.statusBadgeReceived :
          displayStatus === 'InProduction' ? styles.statusBadgeInProgress :
          (displayStatus === 'Ready' || displayStatus === 'Dispatched') ? styles.statusBadgeComplete :
          null
        ]}>
          <StatusIcon color={
            displayStatus === 'Received' ? styles.badgeTextReceived.color :
            displayStatus === 'InProduction' ? styles.badgeTextInProgress.color :
            (displayStatus === 'Ready' || displayStatus === 'Dispatched') ? styles.badgeTextComplete.color :
            styles.badgeText.color
          } size={14} />
          <Text style={[
            styles.badgeText,
            displayStatus === 'Received' ? styles.badgeTextReceived :
            displayStatus === 'InProduction' ? styles.badgeTextInProgress :
            (displayStatus === 'Ready' || displayStatus === 'Dispatched') ? styles.badgeTextComplete :
            null
          ]}>{formatStatusLabel(displayStatus)}</Text>
        </View>
      </View>

      {isCompact ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order</Text>
            <Text style={styles.fieldValue}>#{tracking?.orderNumber ?? order.orderNumber}/{tracking?.orderBatch ?? order.orderBatch}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer</Text>
            <Text style={styles.fieldValue}>{order.customerAccount ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer Ref</Text>
            <Text style={styles.fieldValue}>{order.customerRef ?? tracking?.customerRef ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order Contact</Text>
            <Text style={styles.fieldValue}>{order.orderContact ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <Text style={styles.fieldValue}>{order.deliveryAddress ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price Band</Text>
            <Text style={styles.fieldValue}>{order.priceBand ?? 'N/A'}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.twoColumnRow}>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldValue}>#{tracking?.orderNumber ?? order.orderNumber}/{tracking?.orderBatch ?? order.orderBatch}</Text>
            </View>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{order.customerAccount ?? 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.twoColumnRow}>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Customer Ref</Text>
              <Text style={styles.fieldValue}>{order.customerRef ?? tracking?.customerRef ?? 'N/A'}</Text>
            </View>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Order Contact</Text>
              <Text style={styles.fieldValue}>{order.orderContact ?? 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.twoColumnRow}>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Delivery Address</Text>
              <Text style={styles.fieldValue}>{order.deliveryAddress ?? 'N/A'}</Text>
            </View>
            <View style={styles.twoColumnField}>
              <Text style={styles.fieldLabel}>Price Band</Text>
              <Text style={styles.fieldValue}>{order.priceBand ?? 'N/A'}</Text>
            </View>
          </View>
        </>
      )}

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
    summaryHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.accentMuted,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextReceived: {
      color: theme.colors.statusReceivedText,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextInProgress: {
      color: theme.colors.statusInProgressText,
      fontWeight: '700',
      fontSize: 12,
    },
    badgeTextComplete: {
      color: theme.colors.statusCompleteText,
      fontWeight: '700',
      fontSize: 12,
    },
    statusBadgeReceived: {
      backgroundColor: theme.colors.statusReceived,
      borderColor: theme.colors.border,
    },
    statusBadgeInProgress: {
      backgroundColor: theme.colors.statusInProgress,
      borderColor: theme.colors.accent,
    },
    statusBadgeComplete: {
      backgroundColor: theme.colors.statusComplete,
      borderColor: theme.colors.accent,
    },
    cardMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
  });
}
