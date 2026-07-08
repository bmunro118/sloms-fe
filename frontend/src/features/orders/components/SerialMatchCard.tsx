import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { resolveOrderStatus } from '@src/features/orders/types';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderItem } from '../api';

interface SerialMatchCardProps {
  item: OrderItem;
}

export function SerialMatchCard({ item }: SerialMatchCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  const orderNumber = item.parentOrder as number | undefined;
  const orderBatch = item.parentBatch as number | undefined;

  const handlePress = useCallback(() => {
    if (typeof orderNumber === 'number' && typeof orderBatch === 'number') {
      router.push(`/(app)/orders/${orderNumber}/${orderBatch}` as never);
    }
  }, [orderBatch, orderNumber, router]);

  const status = resolveOrderStatus({
    status: item.status as string | undefined,
    currentStatus: item.currentStatus as string | undefined,
    void: item.void as boolean | undefined,
  });

  return (
    <ThemedCard
      style={styles.card}
      title="Serial Match"
      onPress={typeof orderNumber === 'number' ? handlePress : undefined}
    >
      {/* Order summary row */}
      {typeof orderNumber === 'number' ? (
        <View style={styles.orderRow}>
          <Text style={styles.orderTitle}>
            Order {orderNumber} / Batch {orderBatch ?? '—'}
          </Text>
          {status ? (
            <OrderStatusBadge status={status} size="sm" style={{ alignSelf: 'flex-end' }} />
          ) : null}
        </View>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Item details */}
      <View style={styles.itemSection}>
        <Text style={styles.serialTitle}>#{item.serialNumber}</Text>

        {item.description ? (
          <Text style={styles.description}>{item.description as string}</Text>
        ) : null}

        <View style={styles.fieldsRow}>
          {item.modelCode ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Model</Text>
              <Text style={styles.fieldValue}>{item.modelCode as string}</Text>
            </View>
          ) : null}

          {(item.patientInitial || item.patientSurname) ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Patient</Text>
              <Text style={styles.fieldValue}>
                {[item.patientInitial, item.patientSurname].filter(Boolean).join(' ')}
              </Text>
            </View>
          ) : null}

          {item.category ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>{item.category as string}</Text>
            </View>
          ) : null}

          {item.side ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Side</Text>
              <Text style={styles.fieldValue}>{item.side as string}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    card: { ...common.card, gap: 0 },
    orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderTitle: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      flexShrink: 1,
      marginRight: 8,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginVertical: 10,
    },
    itemSection: {
      gap: 4,
    },
    serialTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.accent,
    },
    description: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    fieldsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 6,
    },
    fieldBlock: {
      minWidth: 80,
    },
    fieldLabel: {
      ...common.fieldLabel,
    },
    fieldValue: {
      ...common.fieldValue,
    },
  });
}
