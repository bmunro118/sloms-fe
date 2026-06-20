import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { TrackingItem } from '../tracking-types';

interface OrderItemsSnapshotCardProps {
  items: TrackingItem[];
}

export function OrderItemsSnapshotCard({ items }: OrderItemsSnapshotCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.card} title="Items Snapshot">
      {items.length === 0 ? (
        <Text style={styles.muted}>No item details returned for this order.</Text>
      ) : (
        items.map((item, index) => (
            <View key={`${item.serialNumber ?? 'item'}-${index}`} style={styles.itemRow}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.cardItem}>{item.serialNumber ?? 'Unknown serial'}</Text>
                <OrderStatusBadge status={item.status ?? ''} size="sm" />
              </View>
              <Text style={styles.cardMeta}>{item.description ?? 'No description'}</Text>
              {item.side ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Side</Text>
                  <Text style={styles.fieldValue}>{item.side}</Text>
                </View>
              ) : null}
            </View>
          ))
        )
      }
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
    itemRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 4,
    },
    itemTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    cardMeta: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    cardItem: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
