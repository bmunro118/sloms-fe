import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { TrackingItem, formatStatusLabel, getStatusIcon } from '../tracking-types';

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
        items.map((item, index) => {
          const ItemStatusIcon = getStatusIcon(item.status);
          return (
            <View key={`${item.serialNumber ?? 'item'}-${index}`} style={styles.itemRow}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.cardItem}>{item.serialNumber ?? 'Unknown serial'}</Text>
                <View style={[
                  styles.itemStatusBadge,
                  item.status === 'Received' ? styles.statusBadgeReceived :
                  item.status === 'InProduction' ? styles.statusBadgeInProgress :
                  (item.status === 'Ready' || item.status === 'Dispatched') ? styles.statusBadgeComplete :
                  null
                ]}>
                  <ItemStatusIcon size={12} color={
                    item.status === 'Received' ? styles.badgeTextReceived.color :
                    item.status === 'InProduction' ? styles.badgeTextInProgress.color :
                    (item.status === 'Ready' || item.status === 'Dispatched') ? styles.badgeTextComplete.color :
                    styles.itemBadgeText.color
                  } />
                  <Text style={[
                    styles.itemBadgeText,
                    item.status === 'Received' ? styles.badgeTextReceived :
                    item.status === 'InProduction' ? styles.badgeTextInProgress :
                    (item.status === 'Ready' || item.status === 'Dispatched') ? styles.badgeTextComplete :
                    null
                  ]}>{formatStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{item.description ?? 'No description'}</Text>
              {item.side ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Side</Text>
                  <Text style={styles.fieldValue}>{item.side}</Text>
                </View>
              ) : null}
            </View>
          );
        })
      )}
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
    itemStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    itemBadgeText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
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
    },
    cardItem: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
