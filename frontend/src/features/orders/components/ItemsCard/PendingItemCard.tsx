import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Trash2 as DeleteIcon } from 'lucide-react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { PendingItem } from './ItemsCardTypes';
import { ItemEditForm, OrderItemEditValues } from './ItemEditForm';

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
    field: {
      marginTop: theme.spacing.md,
    },
    fieldLabel: common.fieldLabel,
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rowField: {
      flex: 1,
    },
    quantityInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
      textAlign: 'center',
      minWidth: 80,
    },
    totalContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    totalText: {
      fontWeight: '600',
      color: theme.colors.textPrimary,
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

  const editValues = useMemo<OrderItemEditValues>(
    () => ({
      description: item.description ?? '',
      patientInitial: item.patientInitial ?? '',
      patientSurname: item.patientSurname ?? '',
      side: item.side ?? '',
      price: item.unitPrice != null ? String(item.unitPrice) : '',
    }),
    [item.description, item.patientInitial, item.patientSurname, item.side, item.unitPrice]
  );

  const formatCurrency = useCallback((value: number): string => {
    return `£${value.toFixed(2)}`;
  }, []);

  const handleEditValueChange = useCallback(
    (field: keyof OrderItemEditValues, value: string) => {
      const updates: Partial<PendingItem> = {};

      if (field === 'price') {
        const price = value.trim() ? parseFloat(value) : 0;
        if (!Number.isNaN(price) && price >= 0) {
          updates.unitPrice = price;
          updates.total = item.quantity * price;
        }
      } else if (field === 'description') {
        updates.description = value;
      } else if (field === 'patientInitial') {
        updates.patientInitial = value;
      } else if (field === 'patientSurname') {
        updates.patientSurname = value;
      } else if (field === 'side') {
        updates.side = value;
      }

      if (Object.keys(updates).length > 0) {
        onUpdateItem(item.id, updates);
      }
    },
    [item.id, item.quantity, onUpdateItem]
  );

  const handleQuantityChange = useCallback(
    (text: string) => {
      const qty = text.trim() ? parseFloat(text) : 0;
      if (!Number.isNaN(qty) && qty >= 0) {
        onUpdateItem(item.id, { quantity: qty, total: qty * item.unitPrice });
      }
    },
    [item.id, item.unitPrice, onUpdateItem]
  );

  const actions: TopBarAction[] = useMemo(
    () => [
      buildIconTopBarAction({
        id: `remove-pending-item-${item.id}`,
        label: 'Remove item',
        onPress: () => onRemoveItem(item.id),
        icon: DeleteIcon,
        disabled: isAddingItem,
      }),
    ],
    [isAddingItem, item.id, onRemoveItem]
  );

  return (
    <ThemedCard title={`Item ${item.itemId}`} actions={actions} style={styles.card}>
      <ItemEditForm values={editValues} isBusy={isAddingItem} onChange={handleEditValueChange} />

      <View style={styles.row}>
        <View style={[styles.field, styles.rowField]}>
          <Text style={styles.fieldLabel}>Quantity</Text>
          <TextInput
            style={styles.quantityInput}
            value={String(item.quantity)}
            onChangeText={handleQuantityChange}
            keyboardType="numeric"
            editable={!isAddingItem}
          />
        </View>
        <View style={[styles.field, styles.rowField]}>
          <Text style={styles.fieldLabel}>Total</Text>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
          </View>
        </View>
      </View>

      {item.error ? (
        <View style={styles.field}>
          <Text style={{ color: theme.colors.danger }}>{item.error}</Text>
        </View>
      ) : null}
    </ThemedCard>
  );
}
