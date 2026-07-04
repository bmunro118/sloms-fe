import { useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Trash2 as DeleteIcon } from 'lucide-react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { PendingItem } from './ItemsCardTypes';

// ── Props ───────────────────────────────────────────────────────────────────────────

export interface PendingItemCardProps {
  item: PendingItem;
  isAddingItem: boolean;
  onUpdateItem: (id: string, updates: Partial<PendingItem>) => void;
  onRemoveItem: (id: string) => void;
}

// ── Styles ──────────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      marginBottom: theme.spacing.sm,
    },
    gridRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: 'center',
    },
    gridCell: {
      flex: 1,
      paddingHorizontal: theme.spacing.sm,
    },
    gridCellItem: {
      flex: 2,
    },
    gridCellTotal: {
      alignItems: 'flex-end',
    },
    gridCellAction: {
      width: 44,
      alignItems: 'center',
    },
    gridInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
      textAlign: 'right',
      minWidth: 80,
    },
    quantityInput: {
      textAlign: 'center',
    },
    priceInput: {
      textAlign: 'right',
    },
    itemIdText: {
      fontWeight: '600',
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    itemDescriptionText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    itemErrorText: {
      fontSize: 12,
      color: theme.colors.danger,
      marginTop: 2,
    },
    totalText: {
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    deleteButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.radii.md,
      opacity: 0.7,
    },
  });
}

// ── Component ─────────────────────────────────────────────────────────────────────────

export function PendingItemCard({
  item,
  isAddingItem,
  onUpdateItem,
  onRemoveItem,
}: PendingItemCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  // Format currency
  const formatCurrency = useCallback((value: number): string => {
    return `£${value.toFixed(2)}`;
  }, []);

  // Handle updating an existing item
  const handleUpdateItem = useCallback((field: keyof PendingItem, value: string | number) => {
    const updates: Partial<PendingItem> = {};

    if (field === 'quantity') {
      const qty = typeof value === 'number' ? value : parseFloat(String(value));
      if (!Number.isNaN(qty) && qty >= 0) {
        updates.quantity = qty;
        updates.total = qty * item.unitPrice;
      }
    } else if (field === 'unitPrice') {
      const price = typeof value === 'number' ? value : parseFloat(String(value));
      if (!Number.isNaN(price) && price >= 0) {
        updates.unitPrice = price;
        updates.total = item.quantity * price;
      }
    } else if (field === 'description') {
      updates.description = String(value);
    } else if (field === 'itemId') {
      updates.itemId = String(value);
    }

    if (Object.keys(updates).length > 0) {
      onUpdateItem(item.id, updates);
    }
  }, [item, onUpdateItem]);

  return (
    <ThemedCard style={styles.card}>
      <View style={styles.gridRow}>
        <View style={[styles.gridCell, styles.gridCellItem]}>
          <Text style={styles.itemIdText}>{item.itemId}</Text>
          {item.description ? <Text style={styles.itemDescriptionText}>{item.description}</Text> : null}
          {item.error ? <Text style={styles.itemErrorText}>{item.error}</Text> : null}
        </View>
        <View style={styles.gridCell}>
          <TextInput
            style={[styles.gridInput, styles.quantityInput]}
            value={String(item.quantity)}
            onChangeText={(text) => handleUpdateItem('quantity', text)}
            keyboardType="numeric"
            editable={!isAddingItem}
          />
        </View>
        <View style={styles.gridCell}>
          <TextInput
            style={[styles.gridInput, styles.priceInput]}
            value={String(item.unitPrice)}
            onChangeText={(text) => handleUpdateItem('unitPrice', text)}
            keyboardType="numeric"
            editable={!isAddingItem}
          />
        </View>
        <View style={[styles.gridCell, styles.gridCellTotal]}>
          <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
        </View>
        <View style={[styles.gridCell, styles.gridCellAction]}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemoveItem(item.id)}
            disabled={isAddingItem}
          >
            <DeleteIcon size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedCard>
  );
}
